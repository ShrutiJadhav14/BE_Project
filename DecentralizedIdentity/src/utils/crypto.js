// frontend/src/utils/crypto.js
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

/**
 * Derive a 256-bit AES key from the user's Ethereum wallet.
 * If no signer is passed, it will fetch it from window.ethereum.
 */
export async function deriveKeyFromWallet(signer) {
  try {
    if (!signer) {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
    }

    const message = "Decentralized Identity Key";
    const signature = await signer.signMessage(message);
    // Convert signature to AES key (256-bit)
    const key = CryptoJS.SHA256(signature).toString();
    return key;
  } catch (err) {
    console.error("Failed to derive key from wallet:", err);
    throw err;
  }
}

/**
 * Encrypt a JSON object using AES and a 256-bit key
 */
export async function encryptData(key, data) {
  try {
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    return { ciphertext };
  } catch (err) {
    console.error("Failed to encrypt data:", err);
    throw err;
  }
}

/**
 * Decrypt AES-encrypted JSON object using a 256-bit key
 */
export async function decryptData(key, encrypted) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted.ciphertext, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (err) {
    console.error("Failed to decrypt data:", err);
    throw err;
  }
}
