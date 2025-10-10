// frontend/src/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { getContract } from "../utils/contract";
import { fetchJSONFromCID } from "../utils/ipfs";
import { deriveKeyFromWallet, decryptData } from "../utils/crypto";

export default function Login() {
  const { videoRef, startCamera, stopCamera, detectLiveness, captureFace } = useFaceRecognition();
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    try {
      if (!window.ethereum) {
        setStatus("❌ MetaMask not detected");
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Get contract connected to signer
      const contract = await getContract();
      const account = await contract.signer.getAddress();

      setStatus("⛓ Fetching registered user from blockchain...");
      const userData = await contract.getUser(account);
      const cid = userData.faceHashOrIPFS;
      const name = userData.name;
      const email = userData.email;

      if (!cid) {
        setStatus("❌ No user registered. Please signup first.");
        return;
      }

      // Start camera and check liveness
      setStatus("Starting camera...");
      await startCamera();
      await new Promise((r) => setTimeout(r, 1000));

      setStatus("👁 Checking liveness...");
      const passed = await detectLiveness({ timeout: 6000, interval: 150 });
      if (!passed) {
        setStatus("❌ Liveness failed.");
        stopCamera();
        return;
      }

      // Capture face descriptor
      setStatus("✅ Liveness passed. Capturing...");
      const liveDescriptor = await captureFace();
      if (!liveDescriptor) {
        setStatus("❌ Face capture failed.");
        stopCamera();
        return;
      }

      // Fetch + decrypt IPFS payload
      setStatus("📡 Fetching face data from IPFS...");
      const encryptedJson = await fetchJSONFromCID(cid);
      const key = await deriveKeyFromWallet();
      const decrypted = await decryptData(key, encryptedJson);
      const storedDescriptor = new Float32Array(decrypted.faceDescriptor);

      // Compare distance
      const distance = Math.sqrt(
        liveDescriptor.reduce((sum, val, i) => sum + (val - storedDescriptor[i]) ** 2, 0)
      );
      const maxDistance = 0.5;
      let confidence = Math.max(0, 100 - (distance / maxDistance) * 100);
      confidence = Math.min(confidence, 100).toFixed(2);
      localStorage.setItem("loginConfidence", confidence);

      if (confidence < 30) {
        setStatus(`❌ Low confidence (${confidence}%) — login denied.`);
        stopCamera();
        return;
      }

      if (distance < maxDistance) {
        const userSession = { name, email, account, cid };
        localStorage.setItem("user", JSON.stringify(userSession));
        setFaceReady(true);
        setStatus(`✅ Match ${confidence}%. Click OK to login.`);
      } else {
        setStatus("❌ Face does not match.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    } finally {
      stopCamera();
    }
  };

  const handleLogin = () => {
    setStatus("Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded mb-3" />

      <div className="flex space-x-2">
        <button
          onClick={handleDetectFace}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Detect & Verify
        </button>
        {faceReady && (
          <button
            onClick={handleLogin}
            className="bg-indigo-600 text-white px-4 py-2 rounded animate-pulse"
          >
            OK
          </button>
        )}
      </div>

      <p className="mt-2 font-bold">{status}</p>
    </div>
  );
}
