// frontend/src/Login.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
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

  // Normalize a vector
  const normalize = (arr) => {
    const mag = Math.sqrt(arr.reduce((sum, v) => sum + v * v, 0));
    return arr.map((v) => v / mag);
  };

  // Cosine similarity helper
  const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return (dot / (magA * magB)) || 0;
  };

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

      if (!userData || !userData.faceHashOrIPFS || userData.faceHashOrIPFS === "") {
        setStatus("❌ No user registered. Please signup first.");
        return;
      }

      const cid = userData.faceHashOrIPFS;
      const name = userData.name;
      const email = userData.email;

      // Start camera + liveness
      setStatus("🎥 Starting camera...");
      await startCamera();
      await new Promise((r) => setTimeout(r, 1000));

      setStatus("👁 Checking liveness...");
      const passed = await detectLiveness({ timeout: 6000, interval: 150 });

      if (!passed) {
        setStatus("❌ Liveness failed.");
        setEmojiState("angry");
        stopCamera();
        return;
      }

      // Capture face
      setStatus("✅ Liveness passed. Capturing...");
      const liveDescriptor = await captureFace();
      stopCamera();

      if (!liveDescriptor) {
        setStatus("❌ Face capture failed.");
        setEmojiState("angry");
        return;
      }

      // Fetch stored encrypted user data from IPFS
      setStatus("📡 Fetching encrypted user data from IPFS...");
      const encryptedJson = await fetchJSONFromCID(cid);

      let key;
      try {
        key = await deriveKeyFromWallet();
      } catch {
        setStatus("❌ Wallet signature required to decrypt identity.");
        stopCamera();
        return;
      }

      const decrypted = await decryptData(key, encryptedJson);
      if (!decrypted.walletAddress || decrypted.walletAddress.toLowerCase() !== account.toLowerCase()) {
        setStatus("❌ Wallet address mismatch — unauthorized user!");
        stopCamera();
        return;
      }

      // Verify hash integrity
      const liveHash = keccak256(toUtf8Bytes(liveDescriptor.join(",")));
      if (liveHash !== decrypted.faceHash) {
        setStatus("❌ Face hash mismatch — identity tampered or not same person!");
        setEmojiState("angry");
        stopCamera();
        setAttempts((prev) => prev + 1);
        return;
      }

      // Compare normalized face descriptors
      const storedFace = normalize(decrypted.faceDescriptor);
      const liveFace = normalize(liveDescriptor);

      const similarity = cosineSimilarity(storedFace, liveFace);
      const similarityPercent = (similarity * 100).toFixed(2);
      localStorage.setItem("loginConfidence", similarityPercent);

      if (similarity < 0.8) {
        setStatus(`❌ Face mismatch — unauthorized attempt (${similarityPercent}%)`);
        setEmojiState("angry");
        setAttempts((prev) => prev + 1);
        return;
      }

      // ✅ Successful match
      setEmojiState("happy");
      setStatus(`✅ Verified ${name} (${similarityPercent}% match). Click OK to login.`);

      const userSession = { name, email, account, cid, verifiedAt: new Date().toISOString() };
      localStorage.setItem("user", JSON.stringify(userSession));
      setFaceReady(true);

    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
      setEmojiState("angry");
      setAttempts((prev) => prev + 1);
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
