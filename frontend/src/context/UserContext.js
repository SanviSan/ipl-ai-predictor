import { createContext, useState, useEffect } from "react";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load from localStorage on startup
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    if (token) {
      setUser({ token, isAdmin });
    }

    // Sync across tabs
    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem("authToken");
      const updatedAdmin = localStorage.getItem("isAdmin") === "true";

      if (updatedToken) {
        setUser({ token: updatedToken, isAdmin: updatedAdmin });
      } else {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ LOGIN function
  const login = (token, isAdmin) => {
    localStorage.setItem("authToken", token);
    localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
    setUser({ token, isAdmin });
  };

  // ✅ LOGOUT function
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("isAdmin");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}