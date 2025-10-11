import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [confidence, setConfidence] = useState(0);
  const [level, setLevel] = useState("Unknown");
  const [color, setColor] = useState("gray");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const storedConfidence = localStorage.getItem("loginConfidence");
    if (storedConfidence) {
      const conf = parseFloat(storedConfidence);
      setConfidence(conf);

      if (conf < 30) {
        setLevel("Rejected ❌ (Too Low Confidence)");
        setColor("red");
      } else if (conf < 50) {
        setLevel("Very Low ⚠️ (Unsafe Match)");
        setColor("orange");
      } else if (conf < 80) {
        setLevel("Medium Match ⚠️");
        setColor("yellow");
      } else {
        setLevel("High Match ✅");
        setColor("green");
      }
    }
  }, []);

  const data = [
    { name: "Matched", value: confidence },
    { name: "Remaining", value: 100 - confidence },
  ];
  const COLORS = [color, "#E0E0E0"];

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("loginConfidence");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
      <h1 className="text-4xl font-bold mb-6">Welcome to Dashboard 🎉</h1>

      {user ? (
        <div className="bg-white shadow-lg rounded-2xl p-6 w-[450px] text-center">
          <p className="text-lg mb-4">
            Hello, <strong>{user.name}</strong> ({user.email})<br />
            Wallet: <span className="font-mono">{user.account}</span>
          </p>

          <h2 className="text-2xl font-semibold mb-2">Face Recognition Accuracy</h2>
          <p
            className={`font-bold mb-2 ${
              color === "green"
                ? "text-green-600"
                : color === "yellow"
                ? "text-yellow-600"
                : color === "orange"
                ? "text-orange-600"
                : "text-red-600"
            }`}
          >
            {confidence.toFixed(2)}% - {level}
          </p>

          <PieChart width={260} height={260}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
            <Legend />
          </PieChart>

          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md"
          >
            Logout
          </button>
        </div>
      ) : (
        <p>No user data found. Please login.</p>
      )}
    </div>
  );
}
