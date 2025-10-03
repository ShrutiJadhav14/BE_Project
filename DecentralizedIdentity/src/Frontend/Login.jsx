import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";

export default function Login() {
  const {
    videoRef,
    startCamera,
    stopCamera,
    detectLiveness,
    captureFace,
  } = useFaceRecognition();

  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    try {
      setStatus("Starting camera...");
      await startCamera();
      await new Promise((r) => setTimeout(r, 1000)); // warm-up

      setStatus("👁️ Please blink once or twice for liveness check...");
      const passed = await detectLiveness({ timeout: 6000, interval: 150 });

      if (!passed) {
        setStatus("❌ Liveness failed. Try again.");
        return;
      }

      setStatus("✅ Liveness passed. Capturing face...");
      const liveDescriptor = await captureFace();

      if (!liveDescriptor) {
        setStatus("❌ Face capture failed. Try again.");
        return;
      }

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        setStatus("❌ No user found. Please signup first.");
        return;
      }

      const storedDescriptor = new Float32Array(user.faceDescriptor);
      const distance = Math.sqrt(
        liveDescriptor.reduce(
          (sum, val, i) => sum + (val - storedDescriptor[i]) ** 2,
          0
        )
      );

      // Convert distance → confidence (0–100%)
      const maxDistance = 0.5; // tuned threshold
      let confidence = Math.max(0, 100 - (distance / maxDistance) * 100);
      confidence = Math.min(confidence, 100).toFixed(2);

      localStorage.setItem("loginConfidence", confidence);

      if (confidence < 20) {
        setStatus(`❌ Low confidence (${confidence}%). Login denied.`);
        stopCamera();
        return;
      }

      if (distance < maxDistance) {
        setFaceReady(true);
        setStatus(`✅ Face matched with ${confidence}% confidence! Logging in...`);
      } else {
        setStatus("❌ Face does not match. Try again.");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    } finally {
      stopCamera();
    }
  };

  const handleLogin = () => {
    setStatus("Login successful ✅ Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded animate-pulse" />

      <div className="flex space-x-2 mt-2">
        <button onClick={startCamera} className="bg-green-500 text-white px-4 py-2 rounded">
          Start Camera
        </button>
        <button onClick={handleDetectFace} className="bg-purple-500 text-white px-4 py-2 rounded">
          Detect Face
        </button>
        {faceReady && (
          <button onClick={handleLogin} className="bg-indigo-500 text-white px-4 py-2 rounded animate-pulse">
            OK
          </button>
        )}
      </div>

      <p className="mt-2 font-bold text-center">{status}</p>
    </div>
  );
}
