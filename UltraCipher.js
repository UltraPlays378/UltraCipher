const crypto = require('crypto');

/**
 * Encrypts text using AES-256-GCM and encodes the result in Base64 five times.
 * @param {string} text - The cleartext to encrypt.
 * @param {Buffer} key - A 32-byte key for AES-256.
 * @returns {string} - The 5x Base64 encoded payload.
 */
function encryptAESGCM5xBase64(text, key) {
    const iv = crypto.randomBytes(12); // Recommended IV length for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Combine IV, AuthTag, and Ciphertext into a single JSON string for transport
    const payload = JSON.stringify({
        iv: iv.toString('hex'),
        authTag: authTag,
        data: encrypted
    });

    // Apply Base64 encoding 5 times
    let encoded = payload;
    for (let i = 0; i < 5; i++) {
        encoded = Buffer.from(encoded).toString('base64');
    }

    return encoded;
}

// --- Implementation Example ---

// Generate a secure 32-byte key (256 bits)
const secretKey = crypto.randomBytes(32);
const message = "Sensitive data to be secured.";

try {
    const finalResult = encryptAESGCM5xBase64(message, secretKey);
    
    console.log("Encryption successful.");
    console.log("Final 5x Base64 String:", finalResult);
} catch (error) {
    console.error("Encryption failed:", error.message);
}
