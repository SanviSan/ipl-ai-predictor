import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";
import DailyWinners from "../components/DailyWinners";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [dailyWinners, setDailyWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ⭐ ADD TOURNAMENT SWITCH
  const [tournament, setTournament] = useState("FIFA WC 2026");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint =
          tournament === "FIFA WC 2026"
            ? "/leaderboard/fifa"
            : "/leaderboard/ipl";

        const [leaderboardData, dailyData] = await Promise.all([
          fetchWithAuth(endpoint),
          fetchWithAuth("/leaderboard/daily"),
        ]);

        setUsers(leaderboardData || []);
        setDailyWinners(dailyData || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tournament]);

  return (
    <div style={{ padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>
          {tournament === "FIFA WC 2026"
            ? "⚽ FIFA Leaderboard"
            : "🏏 IPL Leaderboard"}
        </h2>

        {/* TOURNAMENT SELECTOR */}
        <select
          value={tournament}
          onChange={(e) => setTournament(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
          }}
        >
          <option value="IPL 2026">IPL 2026</option>
          <option value="FIFA WC 2026">FIFA WC 2026</option>
        </select>
      </div>

      {/* DAILY WINNERS */}
      <DailyWinners winners={dailyWinners} loading={loading} />

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* LOADING */}
      {loading ? (
        <p>Loading leaderboard...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            width: "60%",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={th}>Rank</th>
              <th style={th}>Name</th>
              <th style={th}>Points</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.name}>
                <td style={td}>{index + 1}</td>
                <td style={td}>{user.name}</td>
                <td style={td}>{user.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// 🎨 Styles
const th = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left",
};

const td = {
  border: "1px solid #ccc",
  padding: "8px",
};