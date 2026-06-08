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

  const [now, setNow] = useState(new Date());
  const [tournament, setTournament] = useState("FIFA WC 2026");

  // ⏳ live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoadingMatches(true);

        const data = await fetchWithAuth(
          `/matches/upcoming/${encodeURIComponent(tournament)}`
        );

        console.log("Matches:", data);
        setMatches(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load matches");
      } finally {
        setLoadingMatches(false);
      }
    };

    loadMatches();
  }, [tournament]);

  // ⏳ Safe countdown
  const getCountdown = (matchTime) => {
    if (!matchTime) return "⏳ Time TBD";

    const diff = new Date(matchTime).getTime() - now.getTime();

    if (isNaN(diff)) return "⏳ Time TBD";
    if (diff <= 0) return "🔒 Prediction Closed";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `⏳ ${hours}h ${mins}m left`;
  };

  // Predict API
  const handlePredict = async (
    matchId,
    teamId,
    homeScore,
    awayScore
  ) => {
    setLoadingPredict(true);
    setError("");
    setResult(null);

    try {
      const res = await fetchWithAuth("/predict", {
        method: "POST",
        body: JSON.stringify({
          match_id: matchId,
          predicted_team_id:
            teamId === "DRAW" ? null : teamId,
        
          is_draw: teamId === "DRAW",
        
          predicted_home_score:
            homeScore === "" ? null : Number(homeScore),
        
          predicted_away_score:
            awayScore === "" ? null : Number(awayScore)
        }),
      });

      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "Prediction failed");
    } finally {
      setLoadingPredict(false);
    }
  };

  const isFIFA = tournament === "FIFA WC 2026";

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>
          {isFIFA ? "⚽ FIFA World Cup Predictions" : "🏏 IPL Predictions"}
        </h2>

        <select
          value={tournament}
          onChange={(e) => setTournament(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px" }}
        >
          <option value="IPL 2026">IPL 2026</option>
          <option value="FIFA WC 2026">FIFA WC 2026</option>
        </select>
      </div>

      {/* STATES */}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loadingMatches && <p>Loading matches...</p>}
      {!loadingMatches && matches.length === 0 && <p>No upcoming matches</p>}

      {/* MATCH LIST */}
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

    // =========================
    // FIFA CARD
    // =========================
    if (isFIFA) {
      return (
        <div key={match.match_id}>
          <FIFAMatchCard
            match={{
              ...match,
              team1,
              team2,
              aiTeam,
              probability,
            }}
            onPredict={handlePredict}
          />

          <MatchWinners matchId={match.match_id} />
          <NonVoters matchId={match.match_id} />

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

    // =========================
    // IPL CARD
    // =========================
    return (
      <div
        key={`${match.match_id}-${tournament}`}
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h3>
          {team1.short || "T1"} vs {team2.short || "T2"}
        </h3>

        <p style={{ fontSize: "14px", color: "#555" }}>
          📍 {match.venue || "TBD"} | 📅 {match.match_date}
        </p>

        <p
          style={{
            fontWeight: "bold",
            color: isClosed ? "#dc3545" : "#28a745",
          }}
        >
          {getCountdown(matchTime)}
        </p>

        <p>
          🤖 AI Prediction:{" "}
          <b style={{ color: "#007bff" }}>
            {aiTeam} ({probability}%)
          </b>
        </p>
        
        <div style={{ marginTop: "15px" }}>
          <button 
            title={team1.name}
            onClick={() => handlePredict(match.match_id, team1.id)}
            disabled={loadingPredict || isClosed}
            style={{
              marginRight: "10px",
              padding: "8px 15px",
              borderRadius: "6px",
              border: "none",
              background: "#007bff",
              color: "#fff",
            }}
          >
           {team1.short}
          </button>

          <button
            title={team2.name}
            onClick={() => handlePredict(match.match_id, team2.id)}
            disabled={loadingPredict || isClosed}
            style={{
              padding: "8px 15px",
              borderRadius: "6px",
              border: "none",
              background: "#28a745",
              color: "#fff",
            }}
          >
            {team2.short}
          </button>
        </div>

        <MatchWinners matchId={match.match_id} />
        <NonVoters matchId={match.match_id} />

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
  })}

      {/* RESULT PANEL */}
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