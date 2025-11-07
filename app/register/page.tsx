"use client"; // allows this page to use interactive features like useState

import React, { useState } from "react";
import "./register.css"; // connects to the register CSS file

export default function RegisterPage() {
  // These store the user's input values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // This displays short success or error messages
  const [message, setMessage] = useState("");

  // This function runs when the Register button is clicked
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // stops the page from refreshing
    setMessage(""); // clears any previous messages

    // Check if both passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    try {
      // Send data to the backend API
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json(); // waits for the response

      // If something went wrong
      if (!res.ok) {
        setMessage(data?.error || "Registration failed.");
        return;
      }

      // If registration worked successfully
      setMessage("Registration successful! You can now log in.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      // Handles any connection problems
      setMessage("Network error. Please try again.");
    }
  };

  // HTML layout and structure of the page
  return (
    <div className="register-container">
      {/* Back to homepage link */}
      <a href="/" className="back-home">← Back to homepage</a>

      {/* Main title of the page */}
      <h1>Create a New Account</h1>

      {/* Registration form section */}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Enter your full name"
          className="register-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Enter your email"
          className="register-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter your password"
          className="register-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm your password"
          className="register-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Register button */}
        <button type="submit" className="register-button">
          Register
        </button>
      </form>

      {/* Display small feedback messages to the user */}
      {message && <p className="register-message">{message}</p>}

      {/* Small link to return to login page */}
      <div className="register-footer">
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}
