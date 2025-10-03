// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Frontend/Auth"; // your dual-panel signup/login component
import Dashboard from "./Frontend/Dashboard";
import PrivateRoute from "./Frontend/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root path: Auth component */}
        <Route
          path="/"
          element={
            // If user already logged in, redirect to dashboard
            JSON.parse(localStorage.getItem("user")) ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Auth />
            )
          }
        />

        {/* Dashboard protected */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Fallback route: redirect unknown URLs to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
