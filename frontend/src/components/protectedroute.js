import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  console.log("ProtectedRoute token:", token, "children:", children);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}