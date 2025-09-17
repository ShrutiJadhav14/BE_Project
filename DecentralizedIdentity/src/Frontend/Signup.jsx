import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../Frontend/hooks/useWallet";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { registerUser } from "../utils/contract";

export default function Signup() {
  const { account, connectWallet } = useWallet();
  const { videoRef, startCamera, captureFace } = useFaceRecognition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();
const handleDetectFace = async () => {
  const detections = await captureFace();
  if (detections.length > 0) {
    // Store the first face descriptor
    const descriptor = Array.from(detections[0].descriptor); // convert Float32Array → plain array
    localStorage.setItem("faceDescriptor", JSON.stringify(descriptor));

    setFaceReady(true);
    setStatus("✅ Face detected! Click OK to continue.");
  } else {
    setStatus("❌ No face detected, try again.");
  }
};
const handleSignup = async () => {
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const descriptor = JSON.parse(localStorage.getItem("faceDescriptor"));

    await registerUser(name, email, JSON.stringify(descriptor));

    setStatus("✅ Signup successful!");
    setTimeout(() => navigate("/login"), 2000);
  } catch (err) {
    console.error(err);
    setStatus("❌ Error: " + err.message);
  }
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
