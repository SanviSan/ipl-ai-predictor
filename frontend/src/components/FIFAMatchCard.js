import { useState } from "react";

export default function FIFAMatchCard({ match, onPredict }) {
  const [loading, setLoading] = useState(false);

  const team1 = match.team1 || {};
  const team2 = match.team2 || {};

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const matchTime = match.match_datetime || match.match_date;
  const now = new Date();

  const isClosed =
    matchTime &&
    new Date(matchTime).getTime() <= now.getTime();

  const drawAllowed =
    match.stage === "Group Stage";

  const scoreEntered =
    homeScore !== "" &&
    awayScore !== "";

  // -------------------------
  // LOCAL TIME DISPLAY
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

  // -------------------------
  // COUNTDOWN
  // -------------------------
  const getCountdown = () => {
    if (!matchTime) return "⏳ Time TBD";

    const diff =
      new Date(matchTime).getTime() -
      now.getTime();

    if (isNaN(diff)) return "⏳ Time TBD";

    if (diff <= 0) {
      return "🔒 Predictions Closed";
    }

    const days = Math.floor(
      diff / (1000 * 60 * 60 * 24)
    );

    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );

    const mins = Math.floor(
      (diff % (1000 * 60 * 60)) /
      (1000 * 60)
    );

    if (days > 0) {
      return `⏳ ${days}d ${hours}h left`;
    }

    return `⏳ ${hours}h ${mins}m left`;
  };

  // -------------------------
  // PREDICT TEAM
  // -------------------------
  const handlePredict = async (teamId) => {
    setLoading(true);

    await onPredict(
      match.match_id,
      teamId,
      homeScore,
      awayScore
    );

    setLoading(false);
  };

  // -------------------------
  // PREDICT DRAW
  // -------------------------
  const handleDraw = async () => {
    setLoading(true);

    await onPredict(
      match.match_id,
      "DRAW",
      homeScore,
      awayScore
    );

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

            <div style={styles.teamText}>
              <div>{team1.short}</div>
              <div style={styles.teamName}>{team1.name}</div>
            </div>
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

            <div style={styles.teamText}>
              <div>{team2.short}</div>
              <div style={styles.teamName}>{team2.name}</div>
            </div>
          </div>
        </div>

        <span style={styles.stage}>
          {match.stage || "Group Stage"}
        </span>
      </div>

      {/* DATE + VENUE */}
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

      {/* AI */}
      <p style={styles.ai}>
        🤖 AI Prediction:{" "}
        {match.aiTeam} ({match.probability}%)
      </p>

      {/* SCORE PREDICTION */}
      {!isClosed && (
        <div style={{ marginTop: "15px" }}>
          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Score Prediction
          </label>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) =>
                setHomeScore(e.target.value)
              }
              placeholder={team1.short}
              style={styles.scoreInput}
            />

            <span
              style={{
                fontWeight: "bold",
                fontSize: "20px",
              }}
            >
              :
            </span>

            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) =>
                setAwayScore(e.target.value)
              }
              placeholder={team2.short}
              style={styles.scoreInput}
            />
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#28a745",
              marginTop: "8px",
              textAlign: "center",
            }}
          >
            ⭐ Exact score prediction earns
            +5 bonus points
          </p>
        </div>
      )}

      {/* BUTTONS */}
      <div style={styles.buttons}>
        <button
          title={team1.name}
          disabled={
            isClosed ||
            loading ||
            !scoreEntered
          }
          onClick={() =>
            handlePredict(team1.id)
          }
          style={{
            ...styles.btn,
            background: "#007bff",
          }}
        >
          {team1.short}
        </button>

        {drawAllowed && (
          <button
            disabled={
              isClosed ||
              loading ||
              !scoreEntered
            }
            onClick={handleDraw}
            style={{
              ...styles.btn,
              background: "#6c757d",
            }}
          >
            🤝 Draw
          </button>
        )}

        <button
          title={team2.name}
          disabled={
            isClosed ||
            loading ||
            !scoreEntered
          }
          onClick={() =>
            handlePredict(team2.id)
          }
          style={{
            ...styles.btn,
            background: "#28a745",
          }}
        >
          {team2.short}
        </button>
      </div>
    </div>
  );
}

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
    wordBreak: "break-word",
    lineHeight: "1.4",
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
    gap: "8px",
    marginTop: "15px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  
  btn: {
    flex: "1 1 100px",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },

  teams: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
  },

  team: {
    textAlign: "center",
    flex: 1,
    minWidth: 0,
  },

  logo: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },
  teamText: {
    textAlign: "center",
  },
  
  teamName: {
    fontSize: "10px",
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  scoreInput: {
    width: "55px",
    padding: "8px",
    textAlign: "center",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
};