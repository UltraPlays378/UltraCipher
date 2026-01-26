export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors()
      });
    }

    let text = null;
    let salt = "";

    if (request.method === "POST") {
      try {
        const body = await request.json();
        text = body.text;
        salt = body.salt || "";
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
    } else if (request.method === "GET") {
      text = url.searchParams.get("text");
      salt = url.searchParams.get("salt") || "";
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }

    if (!text) return json({ error: "No input provided" }, 400);

    const hash = await ultraHash(text, salt);

    return json({
      alg: "ULTRA-HASH/SHA-256",
      hash
    });
  }
};

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" }
  });
}

async function ultraHash(text, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(salt + text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
