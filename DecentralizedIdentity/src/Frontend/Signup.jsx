import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useWallet from "../Frontend/hooks/useWallet";
import useFaceRecognition from "../Frontend/hooks/useFaceRecognition";
import { registerUser } from "../utils/contract";

export default function Signup() {
  const { account, connectWallet } = useWallet();
<<<<<<< HEAD
  const {
    videoRef,
    startCamera,
    stopCamera,
    captureFace,
    detectLiveness,
    getRandomChallenge,
    modelsLoaded,
  } = useFaceRecognition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [challenge, setChallenge] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
=======
  const { videoRef, startCamera, captureFace } = useFaceRecognition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
>>>>>>> dbd23d6669305a166d86e0c9a3dec234a12bd774
  const [faceReady, setFaceReady] = useState(false);
  const navigate = useNavigate();

  // ✅ Detect face (original)
  const handleDetectFace = async () => {
<<<<<<< HEAD
    if (!modelsLoaded) {
      setStatus("⚠️ Models still loading. Wait a moment...");
      return;
    }

    setStatus("Starting camera...");
    await startCamera();
    await new Promise((r) => setTimeout(r, 500)); // short warm-up

    const newChallenge = getRandomChallenge();
    setChallenge(newChallenge);
    setStatus(`Please perform: ${newChallenge}. Waiting for action...`);

    // use detectLiveness which samples frames for a few seconds
    const passed = await detectLiveness(newChallenge, { timeout: 4500, interval: 150 });

    if (!passed) {
      setStatus("❌ Liveness failed. Make sure you perform the action clearly. Try again.");
      // keep camera running so user can try again, or stop if you prefer
      // stopCamera();
      return;
    }

    setStatus("✅ Liveness passed. Capturing face...");
    const descriptor = await captureFace();
    if (descriptor) {
      setFaceDescriptor(descriptor);
      setFaceReady(true);
      setStatus("✅ Face captured. You can click OK to signup.");
      stopCamera();
    } else {
      setStatus("❌ Face capture failed after liveness. Try again.");
      stopCamera();
=======
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
>>>>>>> dbd23d6669305a166d86e0c9a3dec234a12bd774
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
<<<<<<< HEAD

    const user = {
      name,
      email,
      account,
      faceDescriptor: Array.from(faceDescriptor),
    };

    localStorage.setItem("user", JSON.stringify(user));
    setStatus("Signup successful ✅ Redirecting...");
    setTimeout(() => navigate("/login"), 1700);
=======
>>>>>>> dbd23d6669305a166d86e0c9a3dec234a12bd774
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Signup</h1>

      <input className="border p-2 mb-2 rounded w-72" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <input className="border p-2 mb-2 rounded w-72" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />

      <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded mb-2">
        {account ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      {/* Original video element */}
      <video ref={videoRef} autoPlay muted className="w-80 h-60 border rounded" />

      <p className="text-red-600 font-bold mt-2">{challenge && `Action: ${challenge}`}</p>

      <div className="flex space-x-2 mt-2">
<<<<<<< HEAD
        <button onClick={startCamera} className="bg-green-500 text-white px-4 py-2 rounded">Start Camera</button>
        <button onClick={handleDetectFace} className="bg-purple-500 text-white px-4 py-2 rounded">Detect Face</button>
        {faceReady && <button onClick={handleSignup} className="bg-indigo-500 text-white px-4 py-2 rounded">OK</button>}
=======
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
>>>>>>> dbd23d6669305a166d86e0c9a3dec234a12bd774
      </div>

      <p className="mt-2">{status}</p>
    </div>
  );
}
