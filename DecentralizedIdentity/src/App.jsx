// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Frontend/Auth"; // Combined Signup/Login component
import Dashboard from "./Frontend/Dashboard";
import PrivateRoute from "./Frontend/PrivateRoute";
import LoginWithEmail from "./Frontend/LoginWithEmail"; // Email OTP login page
import EmailVerify from "./Frontend/EmailVerify"; // Verification redirect page

function App() {
  // check login session (from localStorage or Firebase Auth)
  const isAuthenticated =
    JSON.parse(localStorage.getItem("user")) || localStorage.getItem("firebaseAuthUser");

  return (
    <BrowserRouter>
      <Routes>
        {/* Root → Auth (Signup/Login + Face + Fallback options) */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />
          }
        />

        {/* Dashboard (Protected route) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Email OTP Login route */}
        <Route path="/login-email" element={<LoginWithEmail />} />

        {/* Firebase Email verification callback */}
        <Route path="/email-verify" element={<EmailVerify />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
