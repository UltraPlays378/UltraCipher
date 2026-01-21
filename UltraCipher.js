/**
 * Encrypts data using AES-GCM and encodes it in Base64 5 times.
 * Designed for Cloudflare Workers (Web Crypto API).
 */
export default {
  async fetch(request) {
    // 1. Setup: 256-bit key (32 bytes)
    // In production, use a Secret Variable for the key
    const rawKey = new Uint8Array(32).fill(0x01); // Example key
    const key = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const message = "Sensitive data to be secured.";
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // 2. Encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    // 3. Bundle IV + Ciphertext (Ciphertext includes the Auth Tag in Web Crypto)
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // 4. Base64 Encode 5 Times
    let finalString = btoa(String.fromCharCode(...combined));
    for (let i = 0; i < 4; i++) {
      finalString = btoa(finalString);
    }

    return new Response(finalString, {
      headers: { "content-type": "text/plain" },
    });
  },
};
