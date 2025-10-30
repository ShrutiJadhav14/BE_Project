// src/Frontend/LoginWithEmail.jsx
import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail } from "firebase/auth";

// ✅ Firebase config — copy from your Firebase console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function LoginWithEmail() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSendLink = async (e) => {
    e.preventDefault();
    try {
      const actionCodeSettings = {
        url: "http://localhost:5173/email-verify", // Must match Firebase setting
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setStatus("✅ Login link sent! Check your inbox.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Login via Email</h1>

      <form
        onSubmit={handleSendLink}
        className="flex flex-col items-center space-y-3"
      >
        <input
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 w-72"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send Login Link
        </button>
      </form>

      {status && <p className="mt-3 font-medium">{status}</p>}
    </div>
  );
}
