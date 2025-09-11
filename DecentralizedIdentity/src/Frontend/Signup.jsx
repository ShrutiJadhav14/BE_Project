import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../Frontend/hooks/useWallet";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";

export default function Signup() {
  const { account, connectWallet } = useWallet();
  const { videoRef, startCamera, stopCamera, captureFace } = useFaceRecognition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    const descriptor = await captureFace();
    if (descriptor) {
      setFaceDescriptor(descriptor);
      setFaceReady(true);
      setStatus("✅ Face detected! Click OK to continue.");
      stopCamera(); // stop camera automatically
    } else {
      setStatus("❌ No face detected, try again.");
    }
  };

  const handleSignup = () => {
    if (!faceDescriptor) {
      setStatus("⚠️ Please capture your face first.");
      return;
    }

    const user = {
      name,
      email,
      account,
      faceDescriptor: Array.from(faceDescriptor), // convert Float32Array to normal array
    };

    localStorage.setItem("user", JSON.stringify(user));
    setStatus("Signup successful ✅ Redirecting...");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Signup</h1>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 mb-2 rounded w-72"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 mb-2 rounded w-72"
      />

      <button
        onClick={connectWallet}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
      >
        {account ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded" />

      <div className="flex space-x-2 mt-2">
        <button
          onClick={startCamera}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Start Camera
        </button>
        <button
          onClick={handleDetectFace}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Detect Face
        </button>
        {faceReady && (
          <button
            onClick={handleSignup}
            className="bg-indigo-500 text-white px-4 py-2 rounded"
          >
            OK
          </button>
        )}
      </div>

      <p className="mt-2">{status}</p>
    </div>
  );
}
