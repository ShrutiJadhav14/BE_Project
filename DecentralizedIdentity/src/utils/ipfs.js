import axios from "axios";

/**
 * Uploads a JSON object to IPFS using Pinata.
 * @param {Object} data - The JSON data to upload.
 * @returns {Promise<string>} - Returns the IPFS CID.
 */
export async function uploadJSON(data) {
  const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
  if (!PINATA_JWT) throw new Error("Pinata JWT not found in .env");

  try {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      data,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
      }
    );

    const cid = res.data.IpfsHash;
    console.log("✅ Stored on IPFS with CID:", cid);
    return cid;
  } catch (err) {
    console.error("❌ IPFS Upload failed:", err);
    throw new Error("Failed to upload to IPFS");
  }
}

/**
 * Fetches and validates JSON data from IPFS using multiple gateways.
 * @param {string} cid - The IPFS CID.
 * @returns {Promise<Object>} - The parsed JSON data.
 */
export async function fetchJSONFromCID(cid) {
  if (!cid) throw new Error("CID is required to fetch from IPFS");

  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const res = await axios.get(url, { timeout: 8000 });
      if (res.data && typeof res.data === "object") {
        console.log(`📥 Fetched from IPFS (${url}):`, res.data);
        return res.data;
      } else {
        throw new Error("Invalid JSON format");
      }
    } catch (err) {
      console.warn(`⚠️ Gateway failed (${url}):`, err.message);
      continue;
    }
  }

  throw new Error("All IPFS gateways failed to fetch valid JSON");
}
