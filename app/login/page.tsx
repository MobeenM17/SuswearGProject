"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Checks if Details is expected
      if (!res.ok || !data?.user?.User_Role) {
        setError(data?.error || "Login failed. Please check your details.");
        return;
      }

      // Redirect based on role
      const role = data.user.User_Role;
      if (role === "Donor") router.push("/donor");
      else if (role === "Admin") router.push("/admin");
      else if (role === "Staff") router.push("/staff");
      else router.push("/"); // fallback
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="login-container">
      {/* Back to homepage */}
      <a href="/" className="back-home">← Back to homepage</a>

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
        <button type="submit" className="login-button"> 
          Login
        </button>
      </form>

      {error && <p className="login-error">{error}</p>}
    </div>
  );
}
