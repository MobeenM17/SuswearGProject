"use client"; // enables client-side interactivity

import React, { useState } from "react";
import "./login.css"; // connects to the login CSS file

export default function LoginPage() {
  // These state variables store user inputs for email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // This function handles when the login button is clicked
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // stops the page from refreshing automatically
    console.log("User tried to login with:", email, password);
    // Later, this will be connected to the database validation (SQLite/Prisma)
    alert("Login successful (placeholder message)");
  };

  return (
    <div className="login-container">
      {/* Back to homepage link */}
      <a href="/" className="back-home">← Back to homepage</a>

      {/* Page heading for login */}
      <h1>Login to Your Account</h1>

      {/* Login form begins */}
      <form onSubmit={handleLogin}>
        {/* Input field for user email */}
        <input
          type="text"
          placeholder="Enter your email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // stores input into state
          required
        />

        {/* Input field for user password */}
        <input
          type="password"
          placeholder="Enter your password"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // stores input into state
          required
        />

        {/* Login button */}
        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      {/* Footer text with a register link */}
      <div className="login-footer">
        <p>
          Don’t have an account?{" "}
          <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
}
