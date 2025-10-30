import { ethers } from "ethers";

/**
 * Derive AES key securely from the connected MetaMask wallet.
 * The key is never stored — it’s regenerated every time from wallet signature.
 */
export async function deriveKeyFromWallet() {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Ask user to sign a constant message to derive deterministic key
  const message = "Authorize biometric encryption key";
  const signature = await signer.signMessage(message);

  // Convert the signature to SHA-256 hash → 256-bit AES key
  const encoder = new TextEncoder();
  const data = encoder.encode(signature);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const key = await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

/**
 * Encrypt JSON object using AES-GCM with random IV and salt.
 */
export async function encryptData(key, jsonData) {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(jsonData));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // Convert to Base64 for easy IPFS storage
  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return { iv: ivBase64, ciphertext };
}

/**
 * Decrypt data from IPFS (AES-GCM)
 */
export async function decryptData(key, encrypted) {
  try {
    const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), (c) => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const jsonText = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("❌ Decryption failed:", err);
    throw new Error("Corrupted or invalid IPFS data");
  }
}

/**
 * Generate random 32-byte verification key (for blockchain check)
 */
export function generateVerificationKey() {
  return ethers.hexlify(ethers.randomBytes(32));
}
