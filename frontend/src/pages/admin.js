// src/pages/Admin.js

import { useEffect, useState, useContext } from "react";
import { fetchWithAuth } from "../api/api";
import { UserContext } from "../context/UserContext";

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const { user } = useContext(UserContext);

  const isAdmin = user?.isAdmin ?? false;
  const [scores, setScores] = useState({});

  const [qualifiedTeams, setQualifiedTeams] = useState([]);

  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadMatches();
      loadQualifiedTeams();
    }
  }, [isAdmin]);

  const updateScore = (matchId, side, value) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value,
      },
    }));
  };

  const loadMatches = async () => {
    try {
      const data = await fetchWithAuth("/matches/upcoming");
      setMatches(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load matches");
    }
  };
  
  const loadQualifiedTeams = async () => {
    try {
      const data = await fetchWithAuth(
        "/fifa/qualified-teams"
      );
  
      setQualifiedTeams(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateResult = async (
    matchId,
    winnerTeamId = null,
    isDraw = false
  ) => {

     // ✅ ADD THIS CHECK HERE (before API call)
    if (
      isDraw &&
      scores[matchId]?.team1_score !==
        scores[matchId]?.team2_score
    ) {
      alert("Draw requires both scores to be equal");
      return;
    }
    try {
      await fetchWithAuth(`/matches/${matchId}/result`, {
        method: "POST",
        body: JSON.stringify({
          winner_team_id: winnerTeamId,
          is_draw: isDraw,
  
          team1_score:
            scores[matchId]?.team1_score != null &&
            scores[matchId]?.team1_score !== ""
              ? Number(scores[matchId].team1_score)
              : null,

          team2_score:
            scores[matchId]?.team2_score != null &&
            scores[matchId]?.team2_score !== ""
              ? Number(scores[matchId].team2_score)
              : null,
        }),
      });
  
      alert("✅ Result updated");
      loadMatches();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update result");
    }
  };

  const resolveTournament = async () => {

    if (!champion || !runnerUp || !thirdPlace) {
      alert("Please select Champion, Runner Up and Third Place");
      return;
    }
  
    if (
      champion === runnerUp ||
      champion === thirdPlace ||
      runnerUp === thirdPlace
    ) {
      alert("All three teams must be different.");
      return;
    }
  
    const confirmResolve = window.confirm(
      "This will permanently award FIFA Tournament points.\n\nContinue?"
    );
  
    if (!confirmResolve) return;
  
    try {
  
      await fetchWithAuth(
        "/admin/fifa/resolve-tournament",
        {
          method: "POST",
          body: JSON.stringify({
            champion_team_id: Number(champion),
            runner_up_team_id: Number(runnerUp),
            third_place_team_id: Number(thirdPlace),
          }),
        }
      );
  
      alert("🏆 Tournament resolved successfully.");
  
    } catch (err) {
  
      console.error(err);
  
      alert("Failed to resolve tournament.");
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
    marginTop: "10px",
    marginBottom: "10px",
    alignItems: "center",
  }}
>
  <input
    type="number"
    min="0"
    placeholder={m.team1.short}
    value={scores[m.match_id]?.team1_score || ""}
    onChange={(e) =>
      updateScore(
        m.match_id,
        "team1_score",
        e.target.value
      )
    }
    style={{
      width: "70px",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #ccc",
    }}
  />

  <span style={{ fontWeight: "bold" }}>:</span>

  <input
    type="number"
    min="0"
    placeholder={m.team2.short}
    value={scores[m.match_id]?.team2_score || ""}
    onChange={(e) =>
      updateScore(
        m.match_id,
        "team2_score",
        e.target.value
      )
    }
    style={{
      width: "70px",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #ccc",
    }}
  />
</div>

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

    <hr style={{ margin: "40px 0" }} />

    <h2>🏆 Resolve FIFA Tournament</h2>

    <p>
    Award tournament prediction points once the World Cup finishes.
    </p>

    <div style={{ marginBottom: "15px" }}>

      <label><b>Champion</b></label>

      <select
        value={champion}
        onChange={(e)=>setChampion(e.target.value)}
        style={{display:"block",width:"300px",padding:"8px"}}
      >

        <option value="">Select Champion</option>

        {qualifiedTeams.map(team=>(
          <option
            key={team.id}
            value={team.id}
          >
            {team.short_name} - {team.name}
          </option>
        ))}

      </select>

    </div>

    <div style={{ marginBottom: "15px" }}>

      <label><b>Runner Up</b></label>

      <select
        value={runnerUp}
        onChange={(e)=>setRunnerUp(e.target.value)}
        style={{display:"block",width:"300px",padding:"8px"}}
      >

        <option value="">Select Runner Up</option>

        {qualifiedTeams.map(team=>(
          <option
            key={team.id}
            value={team.id}
          >
            {team.short_name} - {team.name}
          </option>
        ))}

      </select>

    </div>

    <div style={{ marginBottom: "20px" }}>

      <label><b>Third Place</b></label>

      <select
        value={thirdPlace}
        onChange={(e)=>setThirdPlace(e.target.value)}
        style={{display:"block",width:"300px",padding:"8px"}}
      >

        <option value="">Select Third Place</option>

        {qualifiedTeams.map(team=>(
          <option
            key={team.id}
            value={team.id}
          >
            {team.short_name} - {team.name}
          </option>
        ))}

      </select>

    </div>

    <button
      onClick={resolveTournament}
      style={{
        background:"#dc3545",
        color:"#fff",
        padding:"12px 24px",
        border:"none",
        borderRadius:"8px",
        cursor:"pointer",
        fontWeight:"bold"
      }}
    >
    Resolve Tournament Predictions
    </button>
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