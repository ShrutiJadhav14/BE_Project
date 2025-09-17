import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import * as faceapi from "face-api.js";

export default function Login() {
  const { videoRef, startCamera, stopCamera, captureFace } = useFaceRecognition();
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    const liveDescriptor = await captureFace();
    if (!liveDescriptor) {
      setStatus("❌ No face detected, try again.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setStatus("❌ No user found, please signup first.");
      return;
    }

    const storedDescriptor = new Float32Array(user.faceDescriptor);
    const distance = faceapi.euclideanDistance(liveDescriptor, storedDescriptor);

    if (distance < 0.5) { // threshold
      setFaceReady(true);
      setStatus("✅ Face matched! Click OK to login.");
      stopCamera();
    } else {
      setStatus("❌ Face does not match. Try again.");
    }
  };

  const handleLogin = () => {
    setStatus("Login successful ✅ Redirecting...");
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

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
            onClick={handleLogin}
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
