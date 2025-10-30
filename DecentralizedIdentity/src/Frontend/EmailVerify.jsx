// src/Frontend/EmailVerify.jsx
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function EmailVerify() {
  const [status, setStatus] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailLink = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = window.localStorage.getItem("emailForSignIn");

          // If email is missing, ask user to re-enter
          if (!email) {
            email = window.prompt("Please provide your email for verification");
          }

          const result = await signInWithEmailLink(
            auth,
            email,
            window.location.href
          );

          // Save user info in localStorage
          localStorage.setItem("user", JSON.stringify(result.user));
          window.localStorage.removeItem("emailForSignIn");

          setStatus("✅ Email verified! Redirecting...");
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          setStatus("⚠️ Invalid or expired verification link.");
        }
      } catch (err) {
        console.error(err);
        setStatus("❌ Verification failed: " + err.message);
      }
    };

    verifyEmailLink();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
      <p>{status}</p>
    </div>
  );
}
