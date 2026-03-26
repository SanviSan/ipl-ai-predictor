// src/pages/login.js
import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/api";
import { ClipLoader } from "react-spinners";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  useEffect(() => {
    console.log("Using API URL:", API_URL);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      login(data.token, data.is_admin);
      navigate("/predict");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🏏 IPL Predictor</h2>
        <p style={styles.subtitle}>Login to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={styles.input}
          />

          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={styles.input}
          />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            background: loading ? "#999" : "#007bff",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px"
          }}
        >
          {loading ? (
            <>
              <ClipLoader size={18} color="#fff" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

// 🎨 Styles
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#f5f7fa",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    width: "320px",
    textAlign: "center",
  },
  title: {
    marginBottom: "5px",
  },
  subtitle: {
    marginBottom: "20px",
    color: "#666",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "10px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    transition: "0.2s ease",
  },
  error: {
    color: "red",
    marginTop: "10px",
    fontSize: "14px",
  }
};