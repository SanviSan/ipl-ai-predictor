import { useState } from "react";

export default function FIFAMatchCard({ match, onPredict }) {
  const [loading, setLoading] = useState(false);

  const team1 = match.team1 || {};
  const team2 = match.team2 || {};

  const matchTime = match.match_datetime || match.match_date;
  const now = new Date();

  // -------------------------
  // TIME DISPLAY (FIXED)
  // -------------------------
  const localMatchTime = matchTime
    ? new Date(matchTime).toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  const isClosed =
    matchTime && new Date(matchTime).getTime() <= now.getTime();

  const drawAllowed = ["Group Stage"].includes(match.stage);

  // -------------------------
  // COUNTDOWN TIMER
  // -------------------------
  const getCountdown = () => {
    if (!matchTime) return "⏳ Time TBD";

    const diff = new Date(matchTime).getTime() - now.getTime();

    if (isNaN(diff)) return "⏳ Time TBD";
    if (diff <= 0) return "🔒 Predictions Closed";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `⏳ ${hours}h ${mins}m left`;
  };

  // -------------------------
  // PREDICT HANDLER
  // -------------------------
  const handlePredict = async (teamId) => {
    setLoading(true);
    await onPredict(match.match_id, teamId);
    setLoading(false);
  };

  const handleDraw = async () => {
    setLoading(true);
    await onPredict(match.match_id, "DRAW");
    setLoading(false);
  };

  return (
    <div style={styles.card}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.teams}>
          <div style={styles.team}>
            <img
              src={`/team-logos/${team1.short}.png`}
              alt={team1.short}
              style={styles.logo}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div>{team1.short}</div>
          </div>

          <h3>VS</h3>

          <div style={styles.team}>
            <img
              src={`/team-logos/${team2.short}.png`}
              alt={team2.short}
              style={styles.logo}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div>{team2.short}</div>
          </div>
        </div>

        <span style={styles.stage}>
          {match.stage || "Group Stage"}
        </span>
      </div>

      {/* VENUE + DATE (FIXED TIMEZONE DISPLAY) */}
      <p style={styles.meta}>
        📍 {match.venue || "TBD"}
        <br />
        📅 {localMatchTime}
      </p>

      {/* COUNTDOWN */}
      <p
        style={{
          ...styles.countdown,
          color: isClosed ? "red" : "green",
        }}
      >
        {getCountdown()}
      </p>

      {/* AI PREDICTION */}
      <p style={styles.ai}>
        🤖 AI Prediction: {match.aiTeam} ({match.probability}%)
      </p>

      {/* BUTTONS */}
      <div style={styles.buttons}>
        <button
          title={team1.name}
          disabled={isClosed || loading}
          onClick={() => handlePredict(team1.id)}
          style={{ ...styles.btn, background: "#007bff" }}
        >
          {team1.short || "Team 1"}
        </button>

        {/* DRAW BUTTON */}
        {drawAllowed && (
          <button
            disabled={isClosed || loading}
            onClick={handleDraw}
            style={{ ...styles.btn, background: "#6c757d" }}
          >
            🤝 Draw
          </button>
        )}

        <button
          title={team2.name}
          disabled={isClosed || loading}
          onClick={() => handlePredict(team2.id)}
          style={{ ...styles.btn, background: "#28a745" }}
        >
          {team2.short || "Team 2"}
        </button>
      </div>
    </div>
  );
}

// -------------------------
// STYLES
// -------------------------
const styles = {
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stage: {
    fontSize: "12px",
    background: "#e9ecef",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  meta: {
    fontSize: "13px",
    color: "#666",
    marginTop: "5px",
  },

  countdown: {
    fontWeight: "bold",
    marginTop: "8px",
  },

  ai: {
    marginTop: "10px",
    color: "#007bff",
  },

  buttons: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
    flexWrap: "wrap",
  },

  btn: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },

  teams: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: "10px",
  },

  team: {
    textAlign: "center",
  },

  logo: {
    width: "60px",
    height: "60px",
    objectFit: "contain",
  },
};