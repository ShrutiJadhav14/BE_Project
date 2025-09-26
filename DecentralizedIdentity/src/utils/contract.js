import { ethers } from "ethers";
import Identity from "../contracts/Identity.json";

// Replace with your deployed address
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner(); // ✅ Await here
  return new ethers.Contract(CONTRACT_ADDRESS, Identity.abi, signer);
}

export async function registerUser(name, email, faceDescriptor) {
  const contract = await getContract(); // ✅ Await here
  const tx = await contract.registerUser(name, email, faceDescriptor);
  await tx.wait();
}

export async function getUser(address) {
  const contract = await getContract(); // ✅ Await here
  return await contract.getUser(address);
}
