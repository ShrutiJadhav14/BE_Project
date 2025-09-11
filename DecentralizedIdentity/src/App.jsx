// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./Frontend/Signup";
import Login from "./Frontend/Login";
import Dashboard from "./Frontend/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
