const MAX_TEXT_LENGTH = 4096;
const MAX_SALT_LENGTH = 256;
const MAX_KEY_VALUES = 64;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 60;

/**
 * 2000-bit One-Way Hash (Truncated to 500 hex chars)
 */
function hash500(inputStr, key, rounds = 10) {
    let state = [];
    for (let i = 0; i < 63; i++) {
        state[i] = (Math.abs(Math.cos(i + 1)) * 0x100000000) >>> 0;
    }

    const keyLen = key.length;

    for (let i = 0; i < inputStr.length; i++) {
        const val = inputStr.codePointAt(i);

        for (let r = 0; r < rounds; r++) {
            const k = key[(i + r) % keyLen];
            const idx = (i + r) % state.length;
            const nextIdx = (idx + 1) % state.length;

            state[idx] = Math.imul(state[idx] ^ (val + k), 0x9E3779B1 + r);
            state[idx] = (state[idx] << 13) | (state[idx] >>> 19);
            state[nextIdx] = (state[nextIdx] ^ state[idx]) + 0x85EBCA6B | 0;
        }
    }

    return state
        .map(x => (x >>> 0).toString(16).padStart(8, '0'))
        .join('')
        .substring(0, 500);
}

function normalizeString(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return typeof value === "string" ? value : String(value);
}

function jsonResponse(body, corsHeaders, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            ...extraHeaders,
        },
    });
}

function getCorsHeaders(request, env) {
    const allowedOrigins = normalizeString(env?.ALLOWED_ORIGINS)
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    const requestOrigin = request.headers.get("Origin");

    if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
        return {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };
    }

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        return {
            "Access-Control-Allow-Origin": requestOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin",
        };
    }

    // No allowed origin match: return first configured origin as a safe default.
    return {
        "Access-Control-Allow-Origin": allowedOrigins[0],
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin",
    };
}


function getApiKeys(env) {
    const csv = normalizeString(env?.ULTRACIPHER_API_KEYS);
    const keys = csv
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    return new Set(keys);
}

function isAuthorized(request, env) {
    const allowedKeys = getApiKeys(env);
    if (allowedKeys.size === 0) {
        return true;
    }

    const providedKey = request.headers.get("x-api-key");
    return Boolean(providedKey && allowedKeys.has(providedKey));
}

function parseKey(key) {
    if (key === undefined || key === null) {
        return [0];
    }

    const rawValues = Array.isArray(key)
        ? key
        : (typeof key === "string" ? key.split(',') : null);

    if (!rawValues) {
        throw new Error("Invalid key format");
    }

    if (rawValues.length === 0 || rawValues.length > MAX_KEY_VALUES) {
        throw new Error(`Key must contain between 1 and ${MAX_KEY_VALUES} values`);
    }

    const parsed = rawValues.map((value) => {
        const n = typeof value === "number" ? value : Number(String(value).trim());
        if (!Number.isInteger(n) || n < 0 || n > 0xFFFFFFFF) {
            throw new Error("Key values must be 32-bit unsigned integers");
        }
        return n;
    });

    return parsed;
}

async function checkRateLimit(request, env) {
    const kv = env?.RATE_LIMIT_KV;
    if (!kv) {
        return { limited: false };
    }

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);
    const windowStart = nowSeconds - (nowSeconds % RATE_LIMIT_WINDOW_SECONDS);
    const kvKey = `rl:${ip}:${windowStart}`;

    const current = Number(await kv.get(kvKey)) || 0;
    if (current >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = RATE_LIMIT_WINDOW_SECONDS - (nowSeconds - windowStart);
        return { limited: true, retryAfter };
    }

    await kv.put(kvKey, String(current + 1), {
        expirationTtl: RATE_LIMIT_WINDOW_SECONDS + 5,
    });

    return { limited: false };
}

export default {
    async fetch(request, env) {
        const corsHeaders = getCorsHeaders(request, env);

        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        if (request.method !== "POST") {
            return jsonResponse({ error: "Method not allowed. Use POST." }, corsHeaders, 405, {
                "Allow": "POST, OPTIONS",
            });
        }

        if (!isAuthorized(request, env)) {
            return jsonResponse({ error: "Unauthorized" }, corsHeaders, 401);
        }

        const limiter = await checkRateLimit(request, env);
        if (limiter.limited) {
            return jsonResponse({ error: "Too many requests" }, corsHeaders, 429, {
                "Retry-After": String(limiter.retryAfter),
            });
        }

        try {
            const body = await request.json();
            const { text, key, salt, raw } = body;

            if (typeof text !== "string") {
                return jsonResponse({ error: "text must be a string" }, corsHeaders, 400);
            }

            if (text.length === 0) {
                return jsonResponse({ error: "text cannot be empty" }, corsHeaders, 400);
            }

            if (text.length > MAX_TEXT_LENGTH) {
                return jsonResponse({ error: `text exceeds max length ${MAX_TEXT_LENGTH}` }, corsHeaders, 400);
            }

            const normalizedSalt = normalizeString(salt);
            if (normalizedSalt.length > MAX_SALT_LENGTH) {
                return jsonResponse({ error: `salt exceeds max length ${MAX_SALT_LENGTH}` }, corsHeaders, 400);
            }

            let keyArray;
            try {
                keyArray = parseKey(key);
            } catch (err) {
                return jsonResponse({ error: err.message }, corsHeaders, 400);
            }

            const pepper = normalizeString(env?.ULTRACIPHER_PEPPER);
            const materialToHash = `${normalizedSalt}${text}${pepper}`;
            const result = hash500(materialToHash, keyArray);

            if (raw === true) {
                return new Response(result, {
                    headers: {
                        "Content-Type": "text/plain",
                        ...corsHeaders,
                    },
                });
            }

            return jsonResponse({ hash: result }, corsHeaders, 200, {
                "Cache-Control": "no-store",
            });
        } catch {
            return jsonResponse({ error: "Invalid JSON" }, corsHeaders, 400);
        }
    }
};
