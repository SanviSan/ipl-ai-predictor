import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/register";
import Predict from "../pages/predict";
import Admin from "../pages/admin";
import Leaderboard from "../pages/leaderboard";

// Components
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/protectedroute";
import AdminRoute from "../components/adminroute"; // New
import FifaStandings from "../pages/FifaStandings";
import FifaWinnerPrediction from "../pages/FifaWinnerPrediction";

import { UserProvider } from "../context/UserContext";

export default function AppRoutes() {
  return (
    <UserProvider>
      <Router>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <Predict />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fifa-standings"
            element={
              <ProtectedRoute>
                <FifaStandings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fifa-winner"
            element={
              <ProtectedRoute>
                <FifaWinnerPrediction />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserProvider>
  );
}