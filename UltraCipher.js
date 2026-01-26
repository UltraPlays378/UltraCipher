export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const body = await request.json().catch(() => null);

    if (!body || !body.secret) {
      return json({ error: "Missing secret" }, 400);
    }

    if (url.pathname === "/encrypt") {
      if (!body.text) return json({ error: "No input provided" }, 400);
      return json(await ultraGCMEncrypt(body.text, body.secret));
    }

    if (url.pathname === "/decrypt") {
      try {
        return json({
          decoded: await ultraGCMDecrypt(body, body.secret)
        });
      } catch {
        return json({ error: "Authentication failed" }, 401);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
