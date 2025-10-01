import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";

export default function useFaceRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      await tf.setBackend("webgl").catch(async () => await tf.setBackend("cpu"));
      await tf.ready();

      const MODEL_URL = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      console.log("✅ Face API models loaded");
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve(true);
        };
      });

      if (!canvasRef.current) {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        videoRef.current.parentNode.appendChild(canvas);
        canvasRef.current = canvas;
      }
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }
  };

  // Capture face descriptor
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return null;
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection?.descriptor || null;
  };

  // Blink-based liveness detection
  const detectLiveness = async ({ timeout = 6000, interval = 70 } = {}) => {
    if (!videoRef.current || !modelsLoaded) return false;

    const start = Date.now();
    let blinkCount = 0;
    let wasClosed = false;

    const getEyeOpenness = (eye) =>
      Math.abs(eye[1].y - eye[5].y) / (Math.abs(eye[0].x - eye[3].x) + 1e-6);

    while (Date.now() - start < timeout && blinkCount < 2) {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks();

      if (!detection) continue;

      // Draw landmarks
      if (canvasRef.current) {
        const dims = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
        faceapi.matchDimensions(canvasRef.current, dims, true);
        const resizedDetections = faceapi.resizeResults(detection, dims);
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, dims.width, dims.height);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      }

      const leftEye = detection.landmarks.getLeftEye();
      const rightEye = detection.landmarks.getRightEye();
      const leftOpenness = getEyeOpenness(leftEye);
      const rightOpenness = getEyeOpenness(rightEye);

      if (leftOpenness < 0.3 && rightOpenness < 0.3) wasClosed = true;
      if (wasClosed && leftOpenness > 0.35 && rightOpenness > 0.35) {
        blinkCount++;
        wasClosed = false;
        console.log(`✅ Blink detected (${blinkCount})`);
      }

      if (blinkCount >= 1) return true;
      await new Promise((res) => setTimeout(res, interval));
    }

    return false;
  };

  return {
    videoRef,
    startCamera,
    stopCamera,
    captureFace,
    detectLiveness,
    modelsLoaded,
  };
}
