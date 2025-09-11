import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";           // TensorFlow.js core
import "@tensorflow/tfjs-backend-cpu";            // CPU backend
import "@tensorflow/tfjs-backend-webgl";          // WebGL backend

export default function useFaceRecognition() {
  const videoRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // ✅ Initialize backend (prefer WebGL for performance, fallback CPU)
        await tf.setBackend("webgl").catch(async () => {
          console.warn("⚠️ WebGL not supported, falling back to CPU");
          await tf.setBackend("cpu");
        });
        await tf.ready();

        // ✅ Load models from /public/models
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

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

  // ✅ Capture face descriptors from webcam feed
  const captureFace = async () => {
    if (!videoRef.current) return [];
    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      return detections;
    } catch (err) {
      console.error("❌ Error capturing face:", err);
      return [];
    }
  };

  return { videoRef, startCamera, captureFace };
}
