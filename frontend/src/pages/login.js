// src/pages/login.js
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" }); // ✅ Use email
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  // ✅ Debug API URL
  useEffect(() => {
    console.log("Using API URL:", API_URL);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend validation or auth errors
        throw new Error(data.detail || "Login failed");
      }

      // ✅ Save token and is_admin to context + localStorage
      login(data.token, data.is_admin);

      console.log("Login successful:", data);

      // Redirect user to predict page
      navigate("/predict");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
        />
        <button type="submit" style={{ padding: "8px 15px", width: "100%" }}>
          Login
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </div>
  );
}