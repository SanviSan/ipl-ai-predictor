// src/pages/login.js
import { useState, useContext } from "react";
import { API_URL } from "../api/api";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { login } = useContext(UserContext); // ✅ ONLY this

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
      if (!res.ok) throw new Error(data.detail || "Login failed");

      console.log("Full login response:", data);

      // ✅ Use context login (handles localStorage + state)
      login(data.token, data.is_admin);

      console.log(
        "Login successful:",
        data.token,
        "Admin:",
        data.is_admin
      );

      navigate("/predict");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ display: "block", marginBottom: "10px", padding: "5px" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{ display: "block", marginBottom: "10px", padding: "5px" }}
        />
        <button type="submit" style={{ padding: "5px 15px" }}>
          Login
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}