export default {
  async fetch(request, env) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Or your specific domain
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      try {
        const { input } = await request.json();
        if (!input) throw new Error("No input provided");

        // --- Your Encryption Logic ---
        const rawKey = new Uint8Array(32).fill(0x01); // Use a secret in production
        const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(input);
        
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedData);
        
        // Combine IV and Ciphertext
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Base64 Encode 5 Times
        let result = btoa(String.fromCharCode(...combined));
        for (let i = 0; i < 4; i++) {
          result = btoa(result);
        }

        return new Response(JSON.stringify({ encoded: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }
    }

    return new Response("Send a POST request with { 'input': 'text' }", { status: 405 });
  }
};
