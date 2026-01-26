export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    let text, alg;

    if (request.method === "POST") {
      try {
        const body = await request.json();
        text = body.text;
        alg = (body.alg || "SHA-256").toUpperCase();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
    } else if (request.method === "GET") {
      text = url.searchParams.get("text");
      alg = (url.searchParams.get("alg") || "SHA-256").toUpperCase();
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }

    if (!text) return json({ error: "No input provided" }, 400);

    try {
      const hash = await ultraHash(text, alg);
      return json({
        framework: "ULTRA-HASH",
        alg,
        hash
      });
    } catch (e) {
      return json({ error: e.message }, 400);
    }
  }
};

// ---------------- helpers ----------------

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

async function ultraHash(text, alg) {
  const enc = new TextEncoder();
  const data = enc.encode(text);

  switch (alg) {
    case "SHA-256":
    case "SHA-384":
    case "SHA-512": {
      const digest = await crypto.subtle.digest(alg, data);
      return hex(digest);
    }

    case "SHA-512/256": {
      const full = await crypto.subtle.digest("SHA-512", data);
      return hex(full).slice(0, 64); // 256 bits
    }

    default:
      throw new Error(
        "Unsupported algorithm. Use SHA-256, SHA-384, SHA-512, or SHA-512/256"
      );
  }
}

function hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
