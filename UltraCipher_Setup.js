export default {
  async fetch(req, env) {
    if (req.method !== "GET") {
      return new Response("GET only", { status: 405 });
    }

    const url = new URL(req.url);

    // /manifest
    if (url.pathname === "/manifest") {
      const manifest = await env.FILES.get("Manifest.json");
      if (!manifest) {
        return Response.json({ error: "Manifest missing" }, { status: 500 });
      }
      return new Response(manifest, {
        headers: { "Content-Type": "application/json" }
      });
    }

    // /file?name=HashSecurity.txt
    if (url.pathname === "/file") {
      const name = url.searchParams.get("name");
      if (!name) {
        return Response.json({ error: "No file specified" }, { status: 400 });
      }

      const file = await env.FILES.get(name);
      if (!file) {
        return new Response("File not found", { status: 404 });
      }

      return new Response(file, {
        headers: {
          "Content-Type": name.endsWith(".json")
            ? "application/json"
            : "text/plain",
          "Content-Disposition": `attachment; filename="${name}"`
        }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
