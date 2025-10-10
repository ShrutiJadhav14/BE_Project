// frontend/src/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { getContract } from "../utils/contract";
import { uploadJSON } from "../utils/ipfs";
import { deriveKeyFromWallet, encryptData } from "../utils/crypto";

export default function Signup() {
  const { videoRef, startCamera, stopCamera, detectLiveness, captureFace } = useFaceRecognition();
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      setStatus("❌ " + nameValidation.message);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setStatus("❌ " + emailValidation.message);
      return;
    }

    if (!account) {
      setStatus("❌ Please connect wallet first");
      return;
    }

    setShowCamera(true); // Show camera div
    setStatus("Starting camera...");
    await startCamera();

    // Wait a little for camera to initialize
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setStatus("👁️ Blink once or twice for liveness check...");
    const passed = await detectLiveness({ timeout: 6000, interval: 50 });

    if (!passed) {
      setStatus("❌ Liveness failed. Try again.");
      stopCamera();
      setShowCamera(false);
      return;
    }

    setStatus("✅ Liveness passed. Capturing face...");
    const descriptor = await captureFace();

    if (descriptor) {
      localStorage.setItem(
        "faceDescriptor",
        JSON.stringify(Array.from(descriptor))
      );
      setFaceReady(true);
      setStatus("✅ Face captured! Click OK to signup.");
      stopCamera(); // Stop camera after capture
    } else {
      setStatus("❌ Face capture failed. Try again.");
      stopCamera();
      setShowCamera(false);
    }
  };

  const handleSignup = async () => {
    try {
      if (!name || !email) {
        setStatus("❌ Please enter name & email");
        return;
      }

      setStatus("Starting camera...");
      await startCamera();
      await new Promise((r) => setTimeout(r, 1000));

      setStatus("👁 Blink once for liveness check...");
      const passed = await detectLiveness({ timeout: 6000, interval: 150 });
      if (!passed) {
        setStatus("❌ Liveness failed.");
        stopCamera();
        return;
      }

      setStatus("✅ Liveness passed. Capturing face...");
      const descriptor = await captureFace();
      if (!descriptor) {
        setStatus("❌ Face capture failed.");
        stopCamera();
        return;
      }

      if (!window.ethereum) {
        setStatus("❌ MetaMask not detected");
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Get contract (already connected to signer)
      const contract = await getContract();

      // Derive AES key + encrypt descriptor
      const key = await deriveKeyFromWallet();
      const encrypted = await encryptData(key, {
        faceDescriptor: Array.from(descriptor),
        createdAt: new Date().toISOString(),
      });

      // Upload encrypted payload to IPFS
      setStatus("📡 Uploading encrypted face data to IPFS...");
      const cid = await uploadJSON(encrypted);

      // Save on-chain
      setStatus("⛓ Registering user on blockchain...");
      const tx = await contract.registerUser(name, email, cid);
      await tx.wait();

      // Get account address from contract's signer
      const account = await contract.signer.getAddress();
      const user = { name, email, account, cid };
      localStorage.setItem("user", JSON.stringify(user));

      setStatus("✅ Signup complete. Redirecting...");
      stopCamera();
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
      stopCamera();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
      <h1 className="text-3xl font-bold mb-4">Signup</h1>

      <input
        type="text"
        placeholder="Name"
        className="border p-2 mb-2 w-72 rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        className="border p-2 mb-4 w-72 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded mb-3" />

      <button
        onClick={handleSignup}
        className="bg-purple-600 text-white px-4 py-2 rounded"
      >
        Capture & Signup
      </button>

      <p className="mt-2 font-bold">{status}</p>
    </div>
  );
}
