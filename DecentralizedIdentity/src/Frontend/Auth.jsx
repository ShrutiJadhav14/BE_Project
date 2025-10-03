import React, { useState,useEffect } from "react";
import Signup from "./Signup";
import Login from "./Login";
import "../Frontend/auth.css";
import { useLocation } from "react-router-dom";

export default function Auth() {
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(true);
  useEffect(() => {
    if (location.state?.showLogin) {
      setIsSignup(false);
    }
  }, [location.state]);

  return (
    <div className="auth-container">
      <div className={`auth-card ${isSignup ? "signup-mode" : "login-mode"}`}>

        {/* Left Half: Form */}
        <div className="form-half">
          {isSignup ? <Signup /> : <Login />}
        </div>

        {/* Right Half: Info Panel */}
        <div className="info-half">
          {isSignup ? (
            <div className="info-panel">
              <h2>Already Registered?</h2>
              <p>Click below to login to your account.</p>
              <button className="toggle-btn" onClick={() => setIsSignup(false)}>
                Login
              </button>
            </div>
          ) : (
            <div className="info-panel">
              <h2>New Here?</h2>
              <p>Create your account to get started.</p>
              <button className="toggle-btn" onClick={() => setIsSignup(true)}>
                Signup
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
