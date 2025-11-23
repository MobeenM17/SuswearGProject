"use client"; 
import React, { useState } from "react";
import "../login/login.css" //connects the login css to the register.
import "./register.css"; // connects this file to the register page styling

export default function RegisterPage() {
  // these stores the users inputs data
  const [fullName, setFullName] = useState(""); //stores full name
  const [email, setEmail] = useState(""); //stores email
  const [password, setPassword] = useState(""); //stores password
  const [confirmPassword, setConfirmPassword] = useState(""); //stores confirm password

  // this shows a message to confirm if the register is valid or invalid
  const [message, setMessage] = useState("");

//This the functions that runs when the user clicks 'register button'
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // stops the page from refreshing
    setMessage(""); 

    //if statement to check both passwords match to each other 
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
      // sends the data to the register route api
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

     
      const data = await res.json();

      // shows user an error if the database runs into any problem.
      if (!res.ok) {
        setMessage(data?.error || "Registration failed. Please try again.");
        return;
      }

      // show success message after successful registrations
      setMessage("Registration successful! You can now log in.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="login-container-box">
      {/* back to the homepage */}
      <a href="/" className="back-home-link">← Back to homepage</a>

      <h1>Create a New Account</h1>

      {/* the registration form */}
      <form onSubmit={handleRegister}>
        {/* full name input */}
        <input
          type="text" placeholder="Enter your full name" // is a text type + tells you what the text field box is 
          className="login-input" // uses the login css to help decorate it so its the same css across the login + register page
          value={fullName} onChange={(e) => setFullName(e.target.value)} required/>

        {/* the email input */}
        <input type="email" placeholder="Enter your email"  // is a email type + tells you what the text field box is 
          className="login-input" 
          value={email}onChange={(e) => setEmail(e.target.value)} required/>

        {/* Password input */}
        <input type="password" placeholder="Enter your password" // is a password type + tells you what the text field box is 
          className="login-input" 
          value={password} onChange={(e) => setPassword(e.target.value)} required/>
      
        {/* Confirm password input */}
        <input type="password" placeholder="Confirm your password" // is a password type + tells you what the text field box is 
          className="login-input" 
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
        

        {/* Register button */}
        <button type="submit" className="login-btn">
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
