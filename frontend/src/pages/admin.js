// src/pages/admin.js
import { useEffect, useState, useContext } from "react";
import { fetchWithAuth } from "../api/api";
import { UserContext } from "../context/UserContext";

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const { user } = useContext(UserContext); // ✅ get user from context
  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      loadMatches();
    }
  }, [isAdmin]);

  const loadMatches = async () => {
    try {
      const data = await fetchWithAuth("/matches/upcoming");
      setMatches(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load matches");
    }
  };

  const updateResult = async (matchId, teamId) => {
    try {
      await fetchWithAuth(`/matches/${parseInt(matchId)}/result`, {
        method: "POST",
        body: JSON.stringify({ winner_team_id: parseInt(teamId) }),
      });

      alert("✅ Result updated!");
      loadMatches();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update result");
    }
  };

  // ❌ Access Denied UI
  if (!isAdmin) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ color: "red" }}>⛔ Access Denied</h2>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  // ✅ Admin UI
  return (
    <div style={{ padding: 20 }}>
      <h2>⚙️ Admin - Update Match Result</h2>

      {matches.length === 0 && <p>No matches available</p>}

      {matches.map((m) => (
        <div
          key={m.match_id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>
            {m.team1.short} vs {m.team2.short}
          </h3>

          <button
            onClick={() => updateResult(m.match_id, m.team1.id)}
            style={{ marginRight: "10px" }}
          >
            {m.team1.short}
          </button>

          <button onClick={() => updateResult(m.match_id, m.team2.id)}>
            {m.team2.short}
          </button>
        </div>
      ))}
    </div>
  );
}