export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      let input = null;

      // 🔹 GET input (Shortcuts "Get Contents of URL" → Method: GET)
      if (request.method === "GET") {
        input = url.searchParams.get("input");
      }

      // 🔹 POST input (Shortcuts → Method: POST → JSON body)
      if (request.method === "POST") {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const body = await request.json();
          input = body.input;
        } else {
          input = await request.text();
        }
      }

      // ❌ No input provided
      if (!input) {
        return new Response(
          JSON.stringify({ error: "No input received" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // 🔐 Example “decryption” (Base64 decode)
      let decoded;
      try {
        decoded = atob(input);
      } catch {
        decoded = "Input was not valid Base64";
      }

      return new Response(
        JSON.stringify({
          success: true,
          received: input,
          decoded: decoded
        }),
        { headers: { "Content-Type": "application/json" } }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
