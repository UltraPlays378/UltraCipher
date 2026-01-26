export default {
  async fetch(request, env) {
    // ----- CORS -----
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    // ----- INPUT -----
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.input || typeof body.input !== "string") {
      return new Response(
        JSON.stringify({ error: "No input provided" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ----- NORMALIZATION -----
    const encoder = new TextEncoder();
    const input = encoder.encode(body.input.normalize("NFKC"));

    // ----- SALT + PEPPER -----
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const pepper = encoder.encode("ULTRA_HASHER_V4_INTERNAL_SECRET");

    // ----- HASH HELPERS -----
    async function hash(alg, data) {
      return new Uint8Array(await crypto.subtle.digest(alg, data));
    }

    function concat(...arrays) {
      const total = arrays.reduce((n, a) => n + a.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const a of arrays) {
        out.set(a, offset);
        offset += a.length;
      }
      return out;
    }

    // ----- CASCADE -----
    let h1 = await hash("SHA-256", concat(salt, input, pepper));
    let h2 = await hash("SHA-512", concat(h1, salt));
    let h3 = await hash("SHA-256", concat(h2, pepper)); // BLAKE2 not available in Workers
    let h4 = await hash("SHA-512", concat(h3, salt, pepper));

    // ----- STRETCHING -----
    let stretched = h4;
    const rounds = 2_000;

    for (let i = 0; i < rounds; i++) {
      const iBytes = encoder.encode(i.toString());
      stretched = await hash("SHA-256", concat(stretched, salt, iBytes));
    }

    // ----- OUTPUT -----
    const toHex = buf =>
      [...buf].map(b => b.toString(16).padStart(2, "0")).join("");

    const toB64 = buf =>
      btoa(String.fromCharCode(...buf));

    const result = {
      alg: "ULTRA-HASHER/4",
      hash: toHex(stretched),
      salt: toB64(salt),
      rounds,
      encoding: "UTF-8 NFKC"
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
};
