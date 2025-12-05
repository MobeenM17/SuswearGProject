"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // lets us use userouter for navigating
import "./login.css"; // connects this file to the login page ccs




//stores all the user input details 
export default function LoginPage() {
  const [email, setEmail] = useState(""); //stores the user email input data
  const [password, setPassword] = useState(""); //stores the password input data
  const [error, setError] = useState(""); //stores the error message 
  const router = useRouter(); //lets us route 


  //handles the login function
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    //try and catch - allows us to run the code with crashes and any error it catches it puts in the catch section
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
//grabs the login api
      const data = await res.json();

      // checks the details if it correct
      if (!res.ok || !data?.user?.User_Role) {
        setError(data?.error || "Login failed. Please check your details."); //uses the seterror function to pass through error string
        return;
      }

      // after logging in it redirects the user to the correct page dashboard based off the user roles from the database
      const role = data.user.User_Role;
      if (role === "Donor") {window.location.href = "/donor";}
      else if (role === "Staff") {window.location.href = "/staff";}
      else if (role === "Admin") {window.location.href = "/admin";}
      else router.push("/"); // sends us back to the homepage 
    } catch { //catches any error
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="login-container-box">
      {/* Back to homepage */}
      <a href="/" className="back-home-link">← Back to homepage</a>

      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="login-input"               
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="login-input"               
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button type="submit" className="login-btn"> 
          Login
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
    </div>
  );
}
