export default {
  async fetch(req) {
    if (req.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const input = await req.text();
    if (!input) {
      return Response.json({ error: "No input provided" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // 🔹 Generate salt (128-bit)
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = btoa(String.fromCharCode(...saltBytes));

    // 🔹 Step 1: SHA-256(input + salt)
    let data = encoder.encode(input + salt);
    let hash = await crypto.subtle.digest("SHA-256", data);

    // 🔹 Step 2: SHA-512(previous hash)
    hash = await crypto.subtle.digest("SHA-512", hash);

    // 🔹 Step 3: SHA-384(previous hash)
    hash = await crypto.subtle.digest("SHA-384", hash);

    // 🔹 Convert final hash → hex
    const finalHash = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return Response.json({
      alg: "ULTRA-HASHER-v5-MULTI",
      hash: finalHash,
      salt: salt
    });
  }
};
