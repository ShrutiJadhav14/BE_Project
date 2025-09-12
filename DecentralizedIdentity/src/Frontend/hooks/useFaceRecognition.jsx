import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

export default function useFaceRecognition() {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // ✅ Prefer WebGL, fallback handled automatically
        await tf.setBackend("webgl");
        await tf.ready();

        // ✅ Load from public/models
        const MODEL_URL = "/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setModelsLoaded(true);
        console.log("✅ Face API models loaded successfully");
      } catch (err) {
        console.error("❌ Error loading Face API models:", err);
      }
    };

    loadModels();
  }, []);

  // ✅ Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("❌ Camera access denied:", err);
    }
  };

  // ✅ Stop webcam
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ✅ Capture one face descriptor
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) {
      console.warn("⚠️ Models not loaded yet");
      return null;
    }
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log("⚠️ No face detected");
        return null;
      }

      console.log("✅ Face detection:", detection);
      return detection.descriptor; // 🔑 Return single descriptor
    } catch (err) {
      console.error("❌ Error capturing face:", err);
      return null;
    }
  };

  return { videoRef, startCamera, stopCamera, captureFace, modelsLoaded };
}
