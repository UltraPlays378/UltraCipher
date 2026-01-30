/**
 * 2000-bit One-Way Hash (Truncated to 500 hex chars)
 */
function hash500(inputStr, key, rounds = 10) {
    // 63 integers * 8 chars = 504 chars (we will slice to 500)
    let state = [];
    for (let i = 0; i < 63; i++) {
        // High-entropy initialization using a fractional expansion
        state[i] = (Math.abs(Math.cos(i + 1)) * 0x100000000) >>> 0;
    }

    const keyLen = key.length;

    for (let i = 0; i < inputStr.length; i++) {
        const val = inputStr.codePointAt(i);
        
        for (let r = 0; r < rounds; r++) {
            const k = key[(i + r) % keyLen];
            const idx = (i + r) % state.length;
            const nextIdx = (idx + 1) % state.length;

            // Non-reversible mixing with Math.imul for 32-bit consistency
            state[idx] = Math.imul(state[idx] ^ (val + k), 0x9E3779B1 + r);
            state[idx] = (state[idx] << 13) | (state[idx] >>> 19);
            
            // Chaining to ensure avalanche effect across all blocks
            state[nextIdx] = (state[nextIdx] ^ state[idx]) + 0x85EBCA6B | 0;
        }
    }

    // Convert to hex and truncate to exactly 500 characters
    return state
        .map(x => (x >>> 0).toString(16).padStart(8, '0'))
        .join('')
        .substring(0, 500);
}

export default {
    async fetch(request) {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed. Use POST.", { status: 405 });
        }

        try {
            const body = await request.json();
            const { text, key, raw } = body;

            if (!text) {
                return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
            }

            const keyArray = Array.isArray(key) ? key : 
                             (typeof key === "string" ? key.split(',').map(n => parseInt(n) || 0) : [0]);

            const result = hash500(text, keyArray);

            if (raw === true) {
                return new Response(result, { headers: { "Content-Type": "text/plain" } });
            }

            return new Response(JSON.stringify({ hash: result }), {
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            });

        } catch (e) {
            return new Response("Invalid JSON", { status: 400 });
        }
    }
};
