import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";
import MatchWinners from "../components/MatchWinners";
import NonVoters from "../components/NonVoters";
import MatchVotes from "../components/MatchVotes";
import FIFAMatchCard from "../components/FIFAMatchCard";

export default function Predict() {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [predictedMatches, setPredictedMatches] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const [now, setNow] = useState(new Date());
  const [tournament, setTournament] = useState("FIFA WC 2026");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoadingMatches(true);

        const data = await fetchWithAuth(
          `/matches/upcoming/${encodeURIComponent(tournament)}`
        );

        setMatches(data || []);
      } catch (err) {
        setError("Failed to load matches");
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, [tournament]);

  const getCountdown = (matchTime) => {
    if (!matchTime) return "⏳ Time TBD";

    const diff = new Date(matchTime).getTime() - now.getTime();

    if (isNaN(diff)) return "⏳ Time TBD";
    if (diff <= 0) return "🔒 Prediction Closed";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `⏳ ${hours}h ${mins}m left`;
  };

  const handlePredict = async (matchId, teamId, homeScore, awayScore) => {
    setLoadingPredict(true);
    setError("");
    setResult(null);

    try {
      const res = await fetchWithAuth("/predict", {
        method: "POST",
        body: JSON.stringify({
          match_id: matchId,
          predicted_team_id: teamId === "DRAW" ? null : teamId,
          is_draw: teamId === "DRAW",
          predicted_home_score: homeScore === "" ? null : Number(homeScore),
          predicted_away_score: awayScore === "" ? null : Number(awayScore),
        }),
      });

      setResult(res);
      setRefreshKey(prev => prev + 1);

      setPredictedMatches((prev) => ({
        ...prev,
        [matchId]: {
          teamId,
          homeScore,
          awayScore,
        },
      }));
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoadingPredict(false);
    }
  };

  const isFIFA = tournament === "FIFA WC 2026";

  const totalMatches = matches.length;
  const completedPredictions =
    Object.keys(predictedMatches).length;

  return (
    <div style={styles.page}>
      
      {/* HEADER (RESPONSIVE FIXED) */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          {isFIFA ? "⚽ FIFA World Cup Predictions" : "🏏 IPL Predictions"}
        </h2>

        <select
          value={tournament}
          onChange={(e) => setTournament(e.target.value)}
          style={styles.select}
        >
          <option value="IPL 2026">IPL 2026</option>
          <option value="FIFA WC 2026">FIFA WC 2026</option>
        </select>
      </div>

      <div
        style={{
          marginTop: "10px",
          marginBottom: "15px",
          padding: "10px",
          background: "#f8f9fa",
          borderRadius: "8px",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        ✅ Predictions Completed: {completedPredictions} / {totalMatches}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loadingMatches && <p>Loading matches...</p>}

      {/* MATCH LIST */}
      <div style={styles.list}>
        {!loadingMatches &&
          matches.map((match) => {
            const team1 = match.team1 || {};
            const team2 = match.team2 || {};
            const matchTime = match.match_datetime;

            const isClosed =
              matchTime &&
              new Date(matchTime).getTime() <= now.getTime();

            const probability =
              match.ai_probability != null
                ? (match.ai_probability * 100).toFixed(0)
                : "50";

            let aiTeam = "TBD";

            if (match.ai_prediction_team_id === team1.id) {
              aiTeam = team1.short;
            } else if (match.ai_prediction_team_id === team2.id) {
              aiTeam = team2.short;
            } else if (match.ai_prediction_team_id === 0) {
              aiTeam = "Draw";
            }

            if (isFIFA) {
              return (
                <div key={match.match_id} style={styles.cardWrapper}>
                 <FIFAMatchCard
                    match={{ ...match, team1, team2, aiTeam, probability }}
                    prediction={predictedMatches[match.match_id]}
                    onPredict={handlePredict}
                  />

                  <MatchWinners matchId={match.match_id} />
                  <NonVoters
                    matchId={match.match_id}
                    refreshKey={refreshKey}
                  />

                  {isClosed && (
                    <MatchVotes
                      matchId={match.match_id}
                      team1Name={team1.short}
                      team2Name={team2.short}
                      isClosed={isClosed}
                    />
                  )}
                </div>
              );
            }

            return (
              <div key={`${match.match_id}`} style={styles.card}>
                <h3 style={styles.matchTitle}>
                  {team1.short} vs {team2.short}
                </h3>

                <p style={styles.meta}>
                  📍 {match.venue || "TBD"} | 📅 {match.match_date}
                </p>

                <p style={{ color: isClosed ? "red" : "green" }}>
                  {getCountdown(matchTime)}
                </p>

                <p style={styles.ai}>
                  🤖 AI: {aiTeam} ({probability}%)
                </p>

                {/* BUTTON WRAP FIX */}
                <div style={styles.buttonWrap}>
                  <button style={styles.blueBtn}>
                    {team1.short}
                  </button>
                  <button style={styles.greenBtn}>
                    {team2.short}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* RESULT */}
      {result && (
        <div style={styles.result}>
          <h3>Prediction Result</h3>
          <p>AI Winner: {result.ai_winner}</p>
          <p>Points: {result.points_awarded}</p>
        </div>
      )}
    </div>
  );
}

/* =========================
   MOBILE RESPONSIVE STYLES
   ========================= */
const styles = {
  page: {
    maxWidth: "100%",
    padding: "12px",
  },

  header: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
  },

  title: {
    fontSize: "18px",
  },

  select: {
    padding: "8px",
    borderRadius: "6px",
    width: "100%",
    maxWidth: "200px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "10px",
  },

  cardWrapper: {
    width: "100%",
  },

  card: {
    background: "#fff",
    padding: "14px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },

  matchTitle: {
    fontSize: "16px",
  },

  meta: {
    fontSize: "12px",
    color: "#666",
  },

  ai: {
    fontSize: "13px",
    color: "#007bff",
  },

  buttonWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
  },

  blueBtn: {
    flex: 1,
    minWidth: "120px",
    padding: "10px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },

  greenBtn: {
    flex: 1,
    minWidth: "120px",
    padding: "10px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },

  result: {
    marginTop: "20px",
    padding: "12px",
    background: "#e8f5e9",
    borderRadius: "10px",
  },
};