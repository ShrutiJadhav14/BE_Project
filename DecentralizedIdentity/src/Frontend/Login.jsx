// frontend/src/Login.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { getContract } from "../utils/contract";
import { fetchJSONFromCID } from "../utils/ipfs";
import { deriveKeyFromWallet, decryptData } from "../utils/crypto";

export default function Login() {
  const { startCamera, stopCamera, detectLiveness, captureFace } = useFaceRecognition();
  const [status, setStatus] = useState("");
  const [faceReady, setFaceReady] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [emojiState, setEmojiState] = useState("neutral"); // "neutral" | "happy" | "angry"
  const navigate = useNavigate();

  const handleDetectFace = async () => {
    try {
      if (!window.ethereum) {
        setStatus("❌ MetaMask not detected");
        return;
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      setStatus("⛓ Fetching registered user...");
      const userData = await contract.getUser(account);
      const cid = userData.faceHashOrIPFS;
      const name = userData.name;
      const email = userData.email;

      if (!cid) {
        setStatus("❌ No user registered. Please signup first.");
        return;
      }

      setStatus("👁 Checking liveness...");
      await startCamera();
      const passed = await detectLiveness({ timeout: 6000, interval: 150 });

      if (!passed) {
        setStatus("❌ Liveness failed.");
        setEmojiState("angry");
        stopCamera();
        return;
      }

      setStatus("✅ Liveness passed. Capturing...");
      const liveDescriptor = await captureFace();
      stopCamera();

      if (!liveDescriptor) {
        setStatus("❌ Face capture failed.");
        setEmojiState("angry");
        return;
      }

      setStatus("📡 Fetching IPFS data...");
      const encryptedJson = await fetchJSONFromCID(cid);
      const key = await deriveKeyFromWallet();
      const decrypted = await decryptData(key, encryptedJson);
      const storedDescriptor = new Float32Array(decrypted.faceDescriptor);

      const distance = Math.sqrt(
        liveDescriptor.reduce((sum, val, i) => sum + (val - storedDescriptor[i]) ** 2, 0)
      );
      const maxDistance = 0.5;
      const confidence = Math.max(0, 100 - (distance / maxDistance) * 100).toFixed(2);

      if (confidence < 30) {
        setEmojiState("angry");
        setStatus(`❌ Low confidence (${confidence}%) — login denied.`);
        setAttempts(prev => prev + 1);
      } else if (distance < maxDistance) {
        setEmojiState("happy");
        setStatus(`✅ Face matched (${confidence}%)! Click OK to login.`);
        setFaceReady(true);
        localStorage.setItem("user", JSON.stringify({ name, email, account, cid }));
      } else {
        setEmojiState("angry");
        setStatus("❌ Face does not match.");
        setAttempts(prev => prev + 1);
      }

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
      setEmojiState("angry");
      setAttempts(prev => prev + 1);
    } finally {
      stopCamera();
    }
  };

  const handleLogin = () => {
    setStatus("Redirecting...");
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const handleRetry = () => {
    setAttempts(0);
    setStatus("");
    setEmojiState("neutral");
    setFaceReady(false);
  };

  const handleEmailOTP = () => {
    setStatus("📩 Redirecting to Email OTP login...");
    setTimeout(() => navigate("/email-otp"), 1000);
  };

  // 🎭 Emoji Animations
  const emojiVariants = {
    neutral: { rotate: 0, scale: 1 },
    happy: { rotate: [0, 5, -5, 0], scale: [1, 1.2, 1], transition: { duration: 0.6 } },
    angry: {
      rotate: [0, -15, 15, -15, 15, 0],
      transition: { duration: 1, ease: "easeInOut" },
    },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

      {/* 😐 Animated Smiley Emoji */}
      <motion.div
        className="text-8xl mb-6"
        variants={emojiVariants}
        animate={emojiState}
      >
        {emojiState === "happy" ? "😊" : emojiState === "angry" ? "😠" : "😐"}
      </motion.div>

      {/* Buttons */}
      <div className="flex space-x-3">
        {attempts < 3 && !faceReady && (
          <button
            onClick={handleDetectFace}
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
          >
            Detect & Verify
          </button>
        )}

        {faceReady && (
          <button
            onClick={handleLogin}
            className="bg-indigo-600 text-white px-4 py-2 rounded animate-pulse"
          >
            OK
          </button>
        )}

        {attempts >= 3 && !faceReady && (
          <>
            <button
              onClick={handleRetry}
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600"
            >
              Retry
            </button>
            <button
              onClick={handleEmailOTP}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            >
              Try via Email OTP
            </button>
          </>
        )}
      </div>

      <p className="mt-4 font-semibold text-center">{status}</p>
    </div>
  );
}
