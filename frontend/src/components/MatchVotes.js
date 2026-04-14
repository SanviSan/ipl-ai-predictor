import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function MatchVotes({ matchId, isClosed, team1Name, team2Name }) {
  const [votes, setVotes] = useState(null);

  useEffect(() => {
    if (!isClosed) return;

    const loadVotes = async () => {
      try {
        const data = await fetchWithAuth(`/matches/${matchId}/votes`);
        setVotes(data);
      } catch (err) {
        console.error("Votes error:", err);
      }
    };

    loadVotes();
  }, [matchId, isClosed]);

  if (!votes) return null;

  return (
    <div style={styles.card}>
      <h4 style={styles.title}>🗳️ Who picked what?</h4>

      <div style={styles.row}>
        <div style={styles.teamBox}>
          <h5>🟡 {team1Name} ({votes.team1.length})</h5>
          {votes.team1.map((name, i) => (
            <p key={i}>👤 {name}</p>
          ))}
        </div>

        <div style={styles.teamBox}>
          <h5>🔵 {team2Name} ({votes.team2.length})</h5>
          {votes.team2.map((name, i) => (
            <p key={i}>👤 {name}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    marginTop: "10px",
    background: "#f9f9f9",
    padding: "12px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },
  title: {
    marginBottom: "10px"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px"
  },
  teamBox: {
    flex: 1,
    background: "#fff",
    padding: "10px",
    borderRadius: "8px"
  }
};