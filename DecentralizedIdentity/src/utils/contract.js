import { ethers } from "ethers";
import Identity from "../contracts/Identity.json";

// Replace with your deployed address
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, Identity.abi, signer);
}

export async function registerUser(name, email, faceDescriptor) {
  const contract = getContract();
  const tx = await contract.registerUser(name, email, faceDescriptor);
  await tx.wait();
}

export async function getUser(address) {
  const contract = getContract();
  return await contract.getUser(address);
}
