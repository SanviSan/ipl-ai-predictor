// src/pages/Leaderboard.js
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await fetchWithAuth("/leaderboard");
        setUsers(data);
      } catch (err) {
        console.error(err);
        alert("Failed to load leaderboard");
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🏆 Leaderboard</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "50%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Rank</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.name}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{index + 1}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{user.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}