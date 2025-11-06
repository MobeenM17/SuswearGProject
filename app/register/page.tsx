"use client"; // allows this page to use interactive features like useState

import React, { useState } from "react";
import "./register.css"; // connects to the register CSS file

export default function RegisterPage() {
  // These store the user's input values
  const [fullName, setFullName] = useState(""); // added full name field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // This will display a short success or error message
  const [message, setMessage] = useState("");

  // This function handles when the user clicks the register button
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault(); // stops the page from refreshing automatically

    // Check if passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    // Temporary message before database connection is added
    console.log("User registered with:", fullName, email);
    setMessage("Registration successful! You can now log in.");
  };

  return (
    <div className="register-container">
      {/* Back to homepage link */}
      <a href="/" className="back-home">← Back to homepage</a>

      {/* Main title of the page */}
      <h1>Create a New Account</h1>

      {/* Registration form section */}
      <form onSubmit={handleRegister}>
        {/* Full Name input field */}
        <input
          type="text"
          placeholder="Enter your full name"
          className="register-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        {/* Email input field */}
        <input
          type="email"
          placeholder="Enter your email"
          className="register-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password input field */}
        <input
          type="password"
          placeholder="Enter your password"
          className="register-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Confirm password input field */}
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
