export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    if (!env.PEPPER || !env.CHILI) {
      return Response.json(
        { error: "Server misconfigured (missing secrets)" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.input || !body.mode) {
      return Response.json(
        { error: "Required: input, mode" },
        { status: 400 }
      );
    }

    const { input, mode } = body;
    const encoder = new TextEncoder();

    let salt = "";

    // 🔀 MODE SWITCH
    if (mode === "salted") {
      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      salt = btoa(String.fromCharCode(...saltBytes));
    } else if (mode === "deterministic") {
      salt = ""; // no randomness, repeatable
    } else {
      return Response.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    // STEP 1 — SHA-256
    let hash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(input + salt)
    );

    // STEP 2 — SHA-512 + pepper
    hash = await crypto.subtle.digest(
      "SHA-512",
      encoder.encode(
        [...new Uint8Array(hash)]
          .map(b => b.toString(16).padStart(2, "0"))
          .join("") + env.PEPPER
      )
    );

    // STEP 3 — SHA-384 + chili
    hash = await crypto.subtle.digest(
      "SHA-384",
      encoder.encode(
        [...new Uint8Array(hash)]
          .map(b => b.toString(16).padStart(2, "0"))
          .join("") + env.CHILI
      )
    );

    const finalHash = [...new Uint8Array(hash)]
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return Response.json({
      alg: "ULTRA-HASHER-v6.1",
      mode,
      hash: finalHash,
      salt: mode === "salted" ? salt : null
    });
  }
};
