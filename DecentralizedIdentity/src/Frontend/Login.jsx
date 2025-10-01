import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import * as faceapi from "face-api.js";

export default function Login() {
  const {
    videoRef,
    startCamera,
    stopCamera,
    captureFace,
    detectLiveness,
    getRandomChallenge,
    modelsLoaded,
  } = useFaceRecognition();

  const [status, setStatus] = useState("");
  const [challenge, setChallenge] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    if (!modelsLoaded) {
      setStatus("⚠️ Models loading, please wait...");
      return;
    }

    setStatus("Starting camera...");
    await startCamera();
    await new Promise((r) => setTimeout(r, 500)); // warm-up

    const newChallenge = getRandomChallenge();
    setChallenge(newChallenge);
    setStatus(`Please perform: ${newChallenge}. Waiting for action...`);

    const passed = await detectLiveness(newChallenge, { timeout: 4500, interval: 150 });

    if (!passed) {
      setStatus("❌ Liveness failed. Try again.");
      // stopCamera(); // optionally stop
      return;
    }

    setStatus("✅ Liveness passed. Capturing face...");
    const liveDescriptor = await captureFace();

    if (!liveDescriptor) {
      setStatus("❌ Face capture failed. Try again.");
      stopCamera();
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setStatus("❌ No user found. Please signup first.");
      stopCamera();
      return;
    }

    const storedDescriptor = new Float32Array(user.faceDescriptor);
    const distance = faceapi.euclideanDistance(liveDescriptor, storedDescriptor);

    if (distance < 0.5) {
      setFaceReady(true);
      setStatus("✅ Face matched & liveness passed! Logging in...");
      stopCamera();
    } else {
      setStatus("❌ Face does not match. Try again.");
    }
  };

  const handleLogin = () => {
    setStatus("Login successful ✅ Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded" />

      <p className="text-red-600 font-bold mt-2">{challenge && `Action: ${challenge}`}</p>

      <div className="flex space-x-2 mt-2">
        <button onClick={startCamera} className="bg-green-500 text-white px-4 py-2 rounded">Start Camera</button>
        <button onClick={handleDetectFace} className="bg-purple-500 text-white px-4 py-2 rounded">Detect Face</button>
        {faceReady && <button onClick={handleLogin} className="bg-indigo-500 text-white px-4 py-2 rounded">OK</button>}
      </div>

      <p className="mt-2">{status}</p>
    </div>
  );
}
