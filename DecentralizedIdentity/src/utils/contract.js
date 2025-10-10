// frontend/src/utils/contract.js
import { ethers } from "ethers";
import Identity from "../contracts/Identity.json";

// Replace with your deployed contract address on Hardhat local
const CONTRACT_ADDRESS = "0xED8CAB8a931A4C0489ad3E3FB5BdEA84f74fD23E";

/**
 * Returns a contract instance connected to the signer
 */
export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []); // request accounts
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, Identity.abi, signer);
  } catch (err) {
    console.error("Failed to connect to contract:", err);
    throw err;
  }
}

/**
 * Register user on-chain
 */
export async function registerUser(name, email, faceDescriptor) {
  try {
    const contract = await getContract();
    const tx = await contract.registerUser(name, email, faceDescriptor);
    await tx.wait();
    console.log("User registered successfully:", name);
  } catch (err) {
    console.error("Register failed:", err);
    throw err;
  }
}

/**
 * Fetch user from contract by address
 */
export async function getUser(address) {
  try {
    const contract = await getContract();
    const user = await contract.getUser(address);
    return user; // { name, email, faceHashOrIPFS, account }
  } catch (err) {
    console.error("Failed to fetch user:", err);
    throw err;
  }
}
