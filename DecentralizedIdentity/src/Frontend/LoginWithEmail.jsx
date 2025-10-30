// frontend/src/Frontend/LoginWithEmail.jsx
import React, { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "../utils/firebase";

export default function LoginWithEmail() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);

  const handleSendLink = async () => {
    try {
      if (!email) return setStatus("⚠️ Please enter an email");
      const actionCodeSettings = {
        url: "http://localhost:5173/email-verify", // redirect route after click
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
      setStatus("✅ Verification link sent! Check your inbox.");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4">Login via Email OTP</h1>
      {!sent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            className="border p-2 rounded w-72 mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleSendLink}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send OTP Link
          </button>
        </>
      ) : (
        <p className="text-green-600 font-semibold">
          A link has been sent to your email!
        </p>
      )}
      <p className="mt-3 font-semibold">{status}</p>
    </div>
  );
}
