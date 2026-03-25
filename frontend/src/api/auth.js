// frontend/src/api/auth.js
import { fetchWithAuth } from "./api";

export const loginUser = async (username, password) => {
  try {
    const data = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    // ✅ Save token if backend returns one
    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }
    return data;
  } catch (err) {
    console.error("Login failed:", err);
    return null;
  }
};