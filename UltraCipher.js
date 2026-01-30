/**
 * 4000-bit One-Way Hash (1000 hex chars)
 * 125 integers * 8 hex chars each = 1000 characters
 */
function hash1000(inputStr, key, rounds = 10) {
    // Initialize state with a pseudo-random sequence 
    // based on a fractional expansion to ensure high entropy.
    let state = [];
    for (let i = 0; i < 125; i++) {
        state[i] = (Math.sin(i + 1) * 0x100000000) >>> 0;
    }

    const keyLen = key.length;

    for (let i = 0; i < inputStr.length; i++) {
        const val = inputStr.codePointAt(i);
        
        for (let r = 0; r < rounds; r++) {
            const k = key[(i + r) % keyLen];
            const idx = (i + r) % state.length;
            const nextIdx = (idx + 1) % state.length;

            // Non-reversible mixing
            // Math.imul ensures 100% correct 32-bit integer math
            state[idx] = Math.imul(state[idx] ^ (val + k), 0x27D4EB2D + r);
            state[idx] = (state[idx] << 17) | (state[idx] >>> 15);
            
            // Chaining: current state affects the next block
            state[nextIdx] = (state[nextIdx] + state[idx]) | 0;
        }
    }

    // Convert to 1000-character hex string
    return state.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export default {
    async fetch(request) {
        if (request.method !== "POST") {
            return new Response("Use POST.", { status: 405 });
        }

        try {
            const body = await request.json();
            const { text, key, raw } = body;

            if (!text) {
                return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
            }

            const keyArray = Array.isArray(key) ? key : 
                             (typeof key === "string" ? key.split(',').map(n => parseInt(n) || 0) : [0]);

            const result = hash1000(text, keyArray);

            if (raw === true) {
                return new Response(result, { headers: { "Content-Type": "text/plain" } });
            }

            return new Response(JSON.stringify({ hash: result }), {
                headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
            });

        } catch (e) {
            return new Response("Invalid JSON", { status: 400 });
        }
    }
};
