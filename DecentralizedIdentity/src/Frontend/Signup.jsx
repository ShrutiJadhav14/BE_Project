import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../Frontend/hooks/useWallet";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { registerUser } from "../utils/contract";

const validateName = (name) => {
  if (!name || name.trim() === "") return { valid: false, message: "Name is required" };
  if (name.length < 3) return { valid: false, message: "Name must be at least 3 characters" };
  if (name.length > 10) return { valid: false, message: "Name cannot exceed 10 characters" };
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) return { valid: false, message: "Name can only contain letters and spaces" };
  return { valid: true };
};

const validateEmail = (email) => {
  if (!email || email.trim() === "") return { valid: false, message: "Email is required" };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) return { valid: false, message: "Invalid email format" };
  if (email.length > 50) return { valid: false, message: "Email cannot exceed 50 characters" };
  return { valid: true };
};

export default function Signup() {
  const { account, connectWallet } = useWallet();
  const {
    videoRef,
    startCamera,
    stopCamera,
    detectLiveness,
    captureFace,
  } = useFaceRecognition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
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
      if (!account) await connectWallet();

      const faceDescriptor =
        JSON.parse(localStorage.getItem("faceDescriptor")) || [];
      const descriptorStr = JSON.stringify(faceDescriptor);

      await registerUser(name, email, descriptorStr);

      const user = { name, email, account, faceDescriptor };
      localStorage.setItem("user", JSON.stringify(user));

      // After signup, hide camera and OK button
      setFaceReady(false);
      setShowCamera(false);
      setSignupDone(true);

      setStatus("Signup successful ✅ Redirecting...");
      setTimeout(() => {
          navigate("/", { state: { showLogin: true } });
      }, 1700);
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6 ${
        signupDone ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <h1 className="text-3xl font-bold mb-4">Signup</h1>

      <input
        className="border p-2 mb-2 rounded w-72"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={signupDone}
      />
      <input
        className="border p-2 mb-2 rounded w-72"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={signupDone}
      />

      <button
        onClick={connectWallet}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
        disabled={signupDone || account}
      >
        {account ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      {/* Camera div */}
      {showCamera && (
        <div className="video-container relative mb-2">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-80 h-60 border rounded animate-pulse"
          />
        </div>
      )}

      <div className="flex space-x-2 mt-2">
        <button
          onClick={handleDetectFace}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={!account || signupDone}
        >
          Detect Face
        </button>

        {faceReady && !signupDone && (
          <button
            onClick={handleSignup}
            className="bg-indigo-500 text-white px-4 py-2 rounded animate-pulse"
          >
            OK
          </button>
        )}
      </div>

      <p className="mt-2 font-bold text-center">{status}</p>
    </div>
  );
}
