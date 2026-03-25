// frontend/src/api/api.js
export const API_URL = process.env.REACT_APP_API_URL;

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // ✅ FIX: Proper error message
    console.error("Backend error:", data);

    if (Array.isArray(data.detail)) {
      // FastAPI validation errors
      const msg = data.detail.map(e => e.msg).join(", ");
      throw new Error(msg);
    }

    throw new Error(data.detail || JSON.stringify(data));
  }

  return data;
};