import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export default function AdminRoute({ children }) {
  const { user } = useContext(UserContext);

  if (!user?.token) {
    // Not logged in
    return <Navigate to="/login" />;
  }

  if (!user.isAdmin) {
    // Logged in but not admin
    return (
      <div style={{ padding: 20, color: "red" }}>
        ⛔ Access Denied: Admins only
      </div>
    );
  }

  return children;
}