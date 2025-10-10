// src/utils/ipfs.js
import { create } from "ipfs-http-client";

// Connect to local IPFS node (make sure IPFS Desktop or daemon is running)
const client = create({
  host: "127.0.0.1",
  port: 5001,
  protocol: "http",
});

// Upload JSON → returns CID string
export async function uploadJSON(obj) {
  const data = JSON.stringify(obj);
  const added = await client.add(data);
  return added.cid.toString(); // safer than .path
}

// Fetch JSON by CID (try local first, fallback to public gateway)
export async function fetchJSONFromCID(cid) {
  const gateways = [
    `http://127.0.0.1:8080/ipfs/${cid}`,     // Local IPFS Desktop / daemon
    `https://ipfs.io/ipfs/${cid}`,           // Public gateway
    `https://cloudflare-ipfs.com/ipfs/${cid}` // Another public gateway
  ];

  for (const url of gateways) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`Gateway failed: ${url}`, err);
    }
  }

  throw new Error(`Failed to fetch CID ${cid} from all gateways`);
}
