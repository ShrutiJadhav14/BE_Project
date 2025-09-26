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

  // ✅ Detect face (original)
  const handleDetectFace = async () => {
    try {
      const detections = await captureFace();
      if (detections && detections.length > 0) {
        const descriptor = Array.from(detections); // convert Float32Array → array
        localStorage.setItem("faceDescriptor", JSON.stringify(descriptor));
        setFaceReady(true);
        setStatus("✅ Face detected! Click OK to continue.");
      } else {
        setStatus("❌ No face detected, try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error detecting face: " + err.message);
    }
  };

  // ✅ Simulate face for testing (camera-free)
  const handleSimulateFace = () => {
    const fakeDescriptor = new Array(128).fill(0.5); // 128-dim fake face descriptor
    localStorage.setItem("faceDescriptor", JSON.stringify(fakeDescriptor));
    setFaceReady(true);
    setStatus("🟢 Simulated face ready for testing!");
  };

  // ✅ Signup handler
  const handleSignup = async () => {
    try {
      if (!account) {
        await connectWallet(); // Ensure wallet is connected
      }

      const faceDescriptor = JSON.parse(localStorage.getItem("faceDescriptor")) || [];
      await registerUser(name, email, faceDescriptor);

      setStatus("✅ Signup successful!");
      navigate("/login");
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

      {/* Original video element */}
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

        {/* Camera-free test button */}
        <button
          onClick={handleSimulateFace}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Simulate Face
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
