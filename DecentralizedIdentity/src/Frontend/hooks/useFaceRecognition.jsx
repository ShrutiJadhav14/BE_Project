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
        await tf.setBackend("webgl");
        await tf.ready();

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

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("❌ Camera access denied:", err);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Capture single face descriptor
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded) return null;
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      return detection.descriptor;
    } catch (err) {
      console.error("❌ Error capturing face:", err);
      return null;
    }
  };

  // Utility sleep
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Challenges & helper
  const challenges = ["BLINK", "TURN_LEFT", "TURN_RIGHT", "SMILE"];
  const getRandomChallenge = () => challenges[Math.floor(Math.random() * challenges.length)];

  // Liveness detection over time window
  // options: timeout (ms), interval (ms)
  const detectLiveness = async (challenge, options = { timeout: 4000, interval: 150 }) => {
    if (!videoRef.current || !modelsLoaded) return false;

    const start = Date.now();
    const timeout = options.timeout ?? 4000;
    const interval = options.interval ?? 150;

    // helper functions to compute landmark metrics
    const eyeOpenness = (eye) => {
      // eye is array of 6 pts: use vertical/horizontal ratio
      const v = Math.abs(eye[1].y - eye[5].y);
      const h = Math.abs(eye[0].x - eye[3].x) + 1e-6;
      return v / h;
    };
    const mouthRatio = (mouth) => {
      const width = Math.abs(mouth[6].x - mouth[0].x) + 1e-6;
      const height = Math.abs(mouth[10].y - mouth[2].y);
      return height / width;
    };
    const getFaceCenterAndWidth = (jaw) => {
      const left = jaw[0].x;
      const right = jaw[16].x;
      return { center: (left + right) / 2, width: Math.abs(right - left) + 1e-6 };
    };

    // For BLINK we need sequence: open -> closed -> open
    if (challenge === "BLINK") {
      let sawOpen = false;
      let sawClosed = false;
      const openThreshold = 0.22; // open if eyeOpenness > this
      const closedThreshold = 0.12; // closed if eyeOpenness < this

      while (Date.now() - start < timeout) {
        try {
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks();
          if (det && det.landmarks) {
            const leftEye = det.landmarks.getLeftEye();
            const rightEye = det.landmarks.getRightEye();
            const leftO = eyeOpenness(leftEye);
            const rightO = eyeOpenness(rightEye);
            const avgO = (leftO + rightO) / 2;

            if (!sawOpen && avgO > openThreshold) {
              sawOpen = true;
            }
            if (sawOpen && !sawClosed && avgO < closedThreshold) {
              sawClosed = true;
            }
            if (sawOpen && sawClosed && avgO > openThreshold + 0.04) {
              // reopened -> blink observed
              return true;
            }
          }
        } catch (e) {
          // ignore frame errors
        }
        await sleep(interval);
      }
      return false;
    }

    // For TURN_LEFT / TURN_RIGHT: compare nose X relative to face center (baseline -> movement)
    if (challenge === "TURN_LEFT" || challenge === "TURN_RIGHT") {
      // get baseline
      let baseline = null;
      const requiredShiftFraction = 0.12; // fraction of face width required
      while (Date.now() - start < timeout / 2 && baseline == null) {
        try {
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks();
          if (det && det.landmarks) {
            const nose = det.landmarks.getNose();
            const jaw = det.landmarks.getJawOutline();
            const { center, width } = getFaceCenterAndWidth(jaw);
            baseline = { noseX: nose[3].x, faceCenter: center, faceWidth: width };
            break;
          }
        } catch (e) {}
        await sleep(interval);
      }
      if (!baseline) return false;

      // Now look for significant shift in desired direction
      const direction = challenge === "TURN_LEFT" ? -1 : 1; // left -> nose x decreases relative to center (camera coords)
      while (Date.now() - start < timeout) {
        try {
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks();
          if (det && det.landmarks) {
            const nose = det.landmarks.getNose();
            const jaw = det.landmarks.getJawOutline();
            const { center, width } = getFaceCenterAndWidth(jaw);
            const currentNoseX = nose[3].x;
            // compute shift relative to initial face center (normalize by face width)
            const baselineOffset = baseline.noseX - baseline.faceCenter;
            const currentOffset = currentNoseX - center;
            const shift = (currentOffset - baselineOffset) / baseline.faceWidth; // normalized
            // check directionality and magnitude
            if (direction === -1 && shift < -requiredShiftFraction) return true; // turned left
            if (direction === 1 && shift > requiredShiftFraction) return true; // turned right
          }
        } catch (e) {}
        await sleep(interval);
      }
      return false;
    }

    // SMILE detection: baseline mouth ratio then increase
    if (challenge === "SMILE") {
      let baselineRatio = null;
      while (Date.now() - start < timeout / 2 && baselineRatio == null) {
        try {
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks();
          if (det && det.landmarks) {
            baselineRatio = mouthRatio(det.landmarks.getMouth());
            break;
          }
        } catch (e) {}
        await sleep(interval);
      }
      if (baselineRatio == null) return false;

      // require increase by an absolute amount or exceed absolute threshold
      const requiredIncrease = 0.12;
      const absoluteThreshold = 0.36;
      while (Date.now() - start < timeout) {
        try {
          const det = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
            .withFaceLandmarks();
          if (det && det.landmarks) {
            const current = mouthRatio(det.landmarks.getMouth());
            if (current - baselineRatio > requiredIncrease || current > absoluteThreshold) return true;
          }
        } catch (e) {}
        await sleep(interval);
      }
      return false;
    }

    return false;
  };

  return {
    videoRef,
    startCamera,
    stopCamera,
    captureFace,
    detectLiveness,
    getRandomChallenge,
    modelsLoaded,
  };
}
