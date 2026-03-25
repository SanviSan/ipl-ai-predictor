import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const loggedIn = !!user?.token;
  const isAdmin = user?.isAdmin;

  return (
    <nav
      style={{
        padding: "10px 20px",
        background: "#222",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <Link to="/" style={{ color: "#fff", marginRight: "15px" }}>
          Home
        </Link>

        {loggedIn && (
          <Link to="/predict" style={{ color: "#fff", marginRight: "15px" }}>
            Predict
          </Link>
        )}

        {loggedIn && isAdmin && (
          <Link to="/admin" style={{ color: "#ffcc00", marginRight: "15px" }}>
            Admin
          </Link>
        )}

        {loggedIn && (
          <Link style={{ color: "#fff", marginRight: "15px" }} to="/leaderboard">
            Leaderboard
          </Link>
        )}
      </div>

      <div>
        {loggedIn && isAdmin && (
          <span
            style={{
              background: "#ffcc00",
              color: "#000",
              padding: "3px 8px",
              borderRadius: "5px",
              marginRight: "10px",
              fontWeight: "bold",
            }}
          >
            ADMIN
          </span>
        )}

        {loggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "5px",
              border: "none",
              background: "#ff4444",
              color: "#fff",
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <Link style={{ color: "#fff", marginRight: "15px" }} to="/login">
              Login
            </Link>
            <Link style={{ color: "#fff" }} to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}