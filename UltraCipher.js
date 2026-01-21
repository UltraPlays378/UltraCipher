export default {
  async fetch(request) {
    // Handle CORS so your HTML can talk to the Worker
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.text; // This is the input from your HTML

        // --- Encryption Logic ---
        const rawKey = new Uint8Array(32).fill(0x01); // Use your actual key
        const key = await crypto.subtle.importKey(
          "raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = new TextEncoder().encode(message);
        const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        let finalString = btoa(String.fromCharCode(...combined));
        for (let i = 0; i < 4; i++) {
          finalString = btoa(finalString);
        }

        return new Response(JSON.stringify({ result: finalString }), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          },
        });
      } catch (e) {
        return new Response("Error: " + e.message, { status: 400 });
      }
    }

    return new Response("Send a POST request with { 'text': 'your data' }", { status: 405 });
  },
};
