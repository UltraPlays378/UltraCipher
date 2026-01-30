/**
 * 512-bit One-Way Hash (128 hex chars)
 */
function hash128(inputStr, key, rounds = 5) {
    let state = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5
    ];

    const keyLen = key.length;

    for (let i = 0; i < inputStr.length; i++) {
        const val = inputStr.codePointAt(i);
        for (let r = 0; r < rounds; r++) {
            const k = key[(i + r) % keyLen];
            const idx = (i + r) % state.length;
            const nextIdx = (idx + 1) % state.length;

            state[idx] = Math.imul(state[idx] ^ (val + k), 0x5DEECE66 + r);
            state[idx] = (state[idx] << 13) | (state[idx] >>> 19);
            state[nextIdx] = (state[nextIdx] + state[idx]) | 0;
        }
    }

    return state.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export default {
    async fetch(request) {
        // Only allow POST requests
        if (request.method !== "POST") {
            return new Response("Method Not Allowed. Use POST.", { status: 405 });
        }

        try {
            // Parse JSON body
            const body = await request.json();
            const { text, key, raw } = body;

            if (!text) {
                return new Response(JSON.stringify({ error: "Missing 'text' in body" }), { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }

            // Handle key: accepts array [12, 58] or comma-string "12,58"
            let keyArray = [];
            if (Array.isArray(key)) {
                keyArray = key;
            } else if (typeof key === "string") {
                keyArray = key.split(',').map(n => parseInt(n.trim(), 10) || 0);
            } else {
                keyArray = [0];
            }

            const hashResult = hash128(text, keyArray);

            if (raw === true) {
                return new Response(hashResult, {
                    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" }
                });
            }

            return new Response(JSON.stringify({ hash: hashResult }), {
                headers: { 
                    "Content-Type": "application/json", 
                    "Cache-Control": "no-store" 
                }
            });

        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
};
