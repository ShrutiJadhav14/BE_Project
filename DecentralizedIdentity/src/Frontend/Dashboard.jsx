import React from "react";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 p-6">
      <h1 className="text-4xl font-bold mb-4">Welcome to Dashboard 🎉</h1>
      {user ? (
        <p className="text-lg">
          Hello, <strong>{user.name}</strong> ({user.email})<br />
          Wallet: <span className="font-mono">{user.account}</span>
        </p>
      ) : (
        <p>No user data found. Please login.</p>
      )}
    </div>
  );
}
