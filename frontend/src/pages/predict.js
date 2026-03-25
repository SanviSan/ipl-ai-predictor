// src/pages/predict.js
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

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
    <div style={{ padding: "20px" }}>
      <h2>🏏 IPL Match Predictions</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ✅ FIX 1: Proper loading state */}
      {loadingMatches && <p>Loading matches...</p>}

      {!loadingMatches && matches.length === 0 && (
        <p>No upcoming matches</p>
      )}

      {!loadingMatches &&
        matches.map((match) => {
          // ✅ Safe access (prevents crashes)
          const team1 = match.team1 || {};
          const team2 = match.team2 || {};

          // ✅ FIX 2: Safe AI probability
          const probability =
            match.ai_probability != null
              ? (match.ai_probability * 100).toFixed(0)
              : "50";

          // ✅ FIX 3: AI team fallback
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
                border: "1px solid #ccc",
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "15px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <h3>
                {team1.short || "T1"} vs {team2.short || "T2"}
              </h3>

              <p>
                📍 {match.venue || "TBD"} | 📅 {match.match_date}
              </p>

              <p>
                🤖 AI Prediction: <b>{aiTeam}</b> ({probability}%)
              </p>

              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() =>
                    handlePredict(match.match_id, team1.id)
                  }
                  disabled={loadingPredict}
                  style={{
                    marginRight: "10px",
                    padding: "8px 15px",
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
                    cursor: "pointer",
                  }}
                >
                  {team2.short || "Team 2"}
                </button>
              </div>
            </div>
          );
        })}

      {/* Result Section */}
      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid green",
            borderRadius: "10px",
            background: "#f0fff0",
          }}
        >
          <h3>✅ Prediction Result</h3>

          <p>
            AI Winner: <b>{result.ai_winner || "N/A"}</b>
          </p>

          <p>
            Probability:{" "}
            <b>
              {result?.ai_probability
                ? (result.ai_probability * 100).toFixed(0)
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