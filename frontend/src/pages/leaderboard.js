import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";
import DailyWinners from "../components/DailyWinners";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [dailyWinners, setDailyWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // ✅ Run both APIs in parallel (FAST)
        const [leaderboardData, dailyData] = await Promise.all([
          fetchWithAuth("/leaderboard"),
          fetchWithAuth("/leaderboard/daily"),
        ]);

        setUsers(leaderboardData);
        setDailyWinners(dailyData);

      } catch (err) {
        console.error("Leaderboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🏆 Leaderboard</h2>

      {/* ✅ No lag now */}
      <DailyWinners winners={dailyWinners} loading={loading} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading leaderboard...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{
          borderCollapse: "collapse",
          width: "60%",
          marginTop: "20px"
        }}>
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
  textAlign: "left"
};

const td = {
  border: "1px solid #ccc",
  padding: "8px"
};