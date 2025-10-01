import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../Frontend/hooks/useWallet";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { registerUser } from "../utils/contract";
import "../Frontend/signup.css";

export default function Signup() {
  const { account, connectWallet } = useWallet();
  const { videoRef, startCamera, stopCamera, captureFace, detectLiveness, modelsLoaded } = useFaceRecognition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    if (!modelsLoaded) {
      setStatus("⚠️ Models loading...");
      return;
    }

    setStatus("Starting camera...");
    await startCamera();

    setStatus("👁️ Blink once or twice for liveness check...");
    const passed = await detectLiveness({ timeout: 6000, interval: 70 });

    if (!passed) {
      setStatus("❌ Liveness failed. Try again.");
      stopCamera();
      return;
    }

    setStatus("✅ Liveness passed. Capturing face...");
    const descriptor = await captureFace();

    if (descriptor) {
      localStorage.setItem("faceDescriptor", JSON.stringify(Array.from(descriptor)));
      setFaceReady(true);
      setStatus("✅ Face captured! Click OK to signup.");
      stopCamera();
    } else {
      setStatus("❌ Face capture failed. Try again.");
      stopCamera();
    }
  };

  const handleSignup = async () => {
    try {
      if (!account) await connectWallet();

      const faceDescriptor = JSON.parse(localStorage.getItem("faceDescriptor")) || [];
      const descriptorStr = JSON.stringify(faceDescriptor); // ✅ Serialize

      await registerUser(name, email, descriptorStr);

      const user = { name, email, account, faceDescriptor };
      localStorage.setItem("user", JSON.stringify(user));
      setStatus("Signup successful ✅ Redirecting...");
      setTimeout(() => navigate("/login"), 1700);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Signup</h1>

      <input className="border p-2 mb-2 rounded w-72" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="border p-2 mb-2 rounded w-72" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

      <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded mb-2">
        {account ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      <div className="video-container relative">
        <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded animate-pulse" />
      </div>

      <div className="flex space-x-2 mt-2">
        <button onClick={handleDetectFace} className="bg-purple-500 text-white px-4 py-2 rounded animate-bounce">
          Detect Face
        </button>
        {faceReady && (
          <button onClick={handleSignup} className="bg-indigo-500 text-white px-4 py-2 rounded animate-pulse">
            OK
          </button>
        )}
      </div>

      <p className="mt-2 font-bold text-center">{status}</p>
    </div>
  );
}
