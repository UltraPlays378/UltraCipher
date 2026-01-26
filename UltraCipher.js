export default {
  async fetch(request) {
    const url = new URL(request.url);

    // --- Handle CORS preflight ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // --- Determine input ---
    let body = {};
    if (request.method === "POST") {
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
    } else if (request.method === "GET") {
      // Quick browser testing: accept query params
      body.text = url.searchParams.get("text") || undefined;
      body.secret = url.searchParams.get("secret") || undefined;
    } else {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
    }

    if (!body.secret) return json({ error: "Missing secret" }, 400);

    // --- Encrypt endpoint ---
    if (url.pathname === "/encrypt") {
      if (!body.text) return json({ error: "No input provided" }, 400);
      const enc = await ultraGCMEncrypt(body.text, body.secret);
      return json(enc);
    }

    // --- Decrypt endpoint ---
    if (url.pathname === "/decrypt") {
      try {
        const dec = await ultraGCMDecrypt(body, body.secret);
        return json({ decoded: dec });
      } catch {
        return json({ error: "Authentication failed" }, 401);
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders() });
  }
};

// --- JSON helper ---
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), "Content-Type": "application/json" }
  });
}

// --- CORS headers ---
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

// --- ULTRA-GCM Core ---
async function sha256(buf) {
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return new Uint8Array(hash);
}

function b64(buf) {
  return btoa(String.fromCharCode(...buf));
}

function unb64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function deriveKey(secret) {
  return sha256(new TextEncoder().encode(secret));
}

async function keystream(key, nonce, length) {
  let out = new Uint8Array(length);
  let counter = 0, offset = 0;
  while (offset < length) {
    const ctr = new TextEncoder().encode(counter.toString());
    const block = await sha256(new Uint8Array([...key, ...nonce, ...ctr]));
    const take = Math.min(block.length, length - offset);
    out.set(block.slice(0, take), offset);
    offset += take;
    counter++;
  }
  return out;
}

// --- Encrypt ---
async function ultraGCMEncrypt(text, secret) {
  const key = await deriveKey(secret);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);

  const ks = await keystream(key, nonce, data.length);
  const cipher = data.map((b, i) => b ^ ks[i]);
  const tag = await sha256(new Uint8Array([...key, ...nonce, ...cipher]));

  return {
    alg: "ULTRA-GCM/1",
    nonce: b64(nonce),
    ciphertext: b64(cipher),
    tag: b64(tag)
  };
}

// --- Decrypt ---
async function ultraGCMDecrypt(body, secret) {
  const key = await deriveKey(secret);
  const nonce = unb64(body.nonce);
  const cipher = unb64(body.ciphertext);
  const tag = unb64(body.tag);

  const expected = await sha256(new Uint8Array([...key, ...nonce, ...cipher]));
  if (!equal(tag, expected)) throw new Error();

  const ks = await keystream(key, nonce, cipher.length);
  const plain = cipher.map((b, i) => b ^ ks[i]);
  return new TextDecoder().decode(plain);
}

// --- Constant-time compare ---
function equal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
