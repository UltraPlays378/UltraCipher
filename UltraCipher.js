export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const input = await req.text();
    if (!input) {
      return Response.json({ error: "No input provided" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // 🧂 Salt (public)
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = btoa(String.fromCharCode(...saltBytes));

    // 🌶️ Pepper (SECRET – env var)
    const pepper = env.PEPPER; // REQUIRED

    // 🌶️🔥 Chili (rotating secret)
    const chili = env.CHILI; // OPTIONAL but recommended

    // STEP 1 — SHA-256(input + salt)
    let hash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(input + salt)
    );

    // STEP 2 — SHA-512(+ pepper)
    hash = await crypto.subtle.digest(
      "SHA-512",
      encoder.encode(
        [...new Uint8Array(hash)]
          .map(b => b.toString(16).padStart(2, "0"))
          .join("") + pepper
      )
    );

    // STEP 3 — SHA-384(+ chili)
    hash = await crypto.subtle.digest(
      "SHA-384",
      encoder.encode(
        [...new Uint8Array(hash)]
          .map(b => b.toString(16).padStart(2, "0"))
          .join("") + chili
      )
    );

    const finalHash = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return Response.json({
      alg: "ULTRA-HASHER-v6-PEPPER-CHILI",
      hash: finalHash,
      salt
    });
  }
};
