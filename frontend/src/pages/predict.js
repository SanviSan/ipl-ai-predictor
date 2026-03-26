// src/pages/predict.js
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";
import MatchWinners from "../components/MatchWinners";

export default function Predict() {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Load matches on page load
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        const data = await fetchWithAuth("/matches/upcoming");

        console.log("Matches from API:", data);

        setMatches(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load matches");
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, []);

  // Handle prediction
  const handlePredict = async (matchId, teamId) => {
    setLoadingPredict(true);
    setError("");
    setResult(null);

    try {
      const res = await fetchWithAuth("/predict", {
        method: "POST",
        body: JSON.stringify({
          match_id: matchId,
          predicted_team_id: teamId,
        }),
      });

      console.log("Prediction response:", res);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Prediction failed");
    } finally {
      setLoadingPredict(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <h2>🏏 IPL Match Predictions</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Loading */}
      {loadingMatches && <p>Loading matches...</p>}

      {/* No matches */}
      {!loadingMatches && matches.length === 0 && (
        <p>No upcoming matches</p>
      )}

      {/* Match list */}
      {!loadingMatches &&
        matches.map((match) => {
          const team1 = match.team1 || {};
          const team2 = match.team2 || {};

          const probability =
            match.ai_probability != null
              ? (match.ai_probability * 100).toFixed(0)
              : "50";

          let aiTeam = "TBD";
          if (match.ai_prediction_team_id === team1.id) {
            aiTeam = team1.short;
          } else if (match.ai_prediction_team_id === team2.id) {
            aiTeam = team2.short;
          }

          return (
            <div
              key={match.match_id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {/* Match Title */}
              <h3 style={{ marginBottom: "5px" }}>
                {team1.short || "T1"} vs {team2.short || "T2"}
              </h3>

              {/* Match Info */}
              <p style={{ color: "#555", fontSize: "14px" }}>
                📍 {match.venue || "TBD"} | 📅 {match.match_date}
              </p>

              {/* AI Prediction */}
              <p style={{ marginTop: "10px" }}>
                🤖 AI Prediction:{" "}
                <b style={{ color: "#007bff" }}>
                  {aiTeam} ({probability}%)
                </b>
              </p>

              {/* Buttons */}
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={() =>
                    handlePredict(match.match_id, team1.id)
                  }
                  disabled={loadingPredict}
                  style={{
                    marginRight: "10px",
                    padding: "8px 15px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {team1.short || "Team 1"}
                </button>

                <button
                  onClick={() =>
                    handlePredict(match.match_id, team2.id)
                  }
                  disabled={loadingPredict}
                  style={{
                    padding: "8px 15px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#28a745",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {team2.short || "Team 2"}
                </button>
              </div>

              {/* 🏆 Match Winners */}
              <MatchWinners matchId={match.match_id} />
            </div>
          );
        })}

      {/* Result Section */}
      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#e8f5e9",
            border: "1px solid #28a745",
          }}
        >
          <h3>✅ Prediction Result</h3>

          <p>
            AI Winner: <b>{result.ai_winner || "N/A"}</b>
          </p>

          <p>
            Probability:{" "}
            <b>
              {result?.probability
                ? (result.probability * 100).toFixed(0)
                : "50"}
              %
            </b>
          </p>

          <p>
            Points Earned: <b>{result.points_awarded ?? 0}</b>
          </p>
        </div>
      )}
    </div>
  );
}