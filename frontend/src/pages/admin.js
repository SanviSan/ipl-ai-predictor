// src/pages/Admin.js

import { useEffect, useState, useContext } from "react";
import { fetchWithAuth } from "../api/api";
import { UserContext } from "../context/UserContext";

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const { user } = useContext(UserContext);

  const isAdmin = user?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      loadMatches();
    }
  }, [isAdmin]);

  const loadMatches = async () => {
    try {
      const data = await fetchWithAuth("/matches/upcoming");
      setMatches(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load matches");
    }
  };

  const updateResult = async (
    matchId,
    winnerTeamId = null,
    isDraw = false
  ) => {
    try {
      await fetchWithAuth(`/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({
          winner_team_id: winnerTeamId,
          is_draw: isDraw,
        }),
      });

      alert("✅ Result updated");
      loadMatches();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update result");
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ color: "red" }}>⛔ Access Denied</h2>
        <p>You are not authorized to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>⚙️ Admin - Update Match Result</h2>

      {matches.length === 0 && (
        <p>No upcoming matches available</p>
      )}

      {matches.map((m) => {
        console.log("Tournament =", m.tournament);
        const isFifa = m.tournament === "FIFA WC 2026";

        return (
          <div
            key={m.match_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              background: "#fff",
            }}
          >
            <h3>
              {m.team1.short} vs {m.team2.short}
            </h3>

            <p style={{ color: "#666" }}>
              {m.tournament}
              {m.stage && ` • ${m.stage}`}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              {/* Team 1 Win */}
              <button
                onClick={() =>
                  updateResult(
                    m.match_id,
                    m.team1.id,
                    false
                  )
                }
                style={styles.team1Btn}
              >
                🏆 {m.team1.short}
              </button>

              {/* FIFA Draw */}
              {isFifa && (
                <button
                  onClick={() =>
                    updateResult(
                      m.match_id,
                      null,
                      true
                    )
                  }
                  style={styles.drawBtn}
                >
                  🤝 Draw
                </button>
              )}

              {/* Team 2 Win */}
              <button
                onClick={() =>
                  updateResult(
                    m.match_id,
                    m.team2.id,
                    false
                  )
                }
                style={styles.team2Btn}
              >
                🏆 {m.team2.short}
              </button>

              {/* No Result */}
              <button
                onClick={() =>
                  updateResult(
                    m.match_id,
                    null,
                    false
                  )
                }
                style={styles.nrBtn}
              >
                🚫 No Result
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  team1Btn: {
    padding: "10px 16px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  team2Btn: {
    padding: "10px 16px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  drawBtn: {
    padding: "10px 16px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  nrBtn: {
    padding: "10px 16px",
    background: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};