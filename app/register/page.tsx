"use client"; 

import React, { useState } from "react";
import "./register.css"; // connects this file to the register page styling

export default function RegisterPage() {
  // These store user input values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // This shows short success or error messages
  const [message, setMessage] = useState("");

  //Function that runs when the "Register" button is clicked
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // stops the page from refreshing
    setMessage(""); 

    //Check if both passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

  
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}[\]:;\"'<>,.?/`~]{8,}$/.test(password)) {
      setMessage("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

    try {
      // Sends data to the register route api
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

     
      const data = await res.json();

      // Showcases an error if database runs into any problem.
      if (!res.ok) {
        setMessage(data?.error || "Registration failed. Please try again.");
        return;
      }

      // show success message after successful registrations
      setMessage("✅ Registration successful! You can now log in.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="register-container">
      {/* Back to homepage link */}
      <a href="/" className="back-home">← Back to homepage</a>

      <h1>Create a New Account</h1>

      {/* Registration Form */}
      <form onSubmit={handleRegister}>
        {/* Full name input */}
        <input
          type="text"
          placeholder="Enter your full name"
          className="register-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        {/* Email input */}
        <input
          type="email"
          placeholder="Enter your email"
          className="register-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password input */}
        <input
          type="password"
          placeholder="Enter your password"
          className="register-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Confirm password input */}
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

      {/* Feedback message display */}
      {message && <p className="register-message">{message}</p>}

      {/* adds a link below the form to go back to login*/}
      <div className="register-footer">
        <p>
          Already have an account?{" "}
          <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
}
