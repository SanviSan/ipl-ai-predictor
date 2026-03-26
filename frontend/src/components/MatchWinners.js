// src/components/MatchWinners.js
import { useEffect, useState } from "react";
import { API_URL } from "../api/api";

export default function MatchWinners({ matchId }) {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/matches/${matchId}/winners`)
      .then(res => res.json())
      .then(data => setWinners(data))
      .catch(err => console.error(err));
  }, [matchId]);

  if (!winners.length) return null;

  return (
    <div style={{
      marginTop: "10px",
      background: "#e8f5e9",
      padding: "10px",
      borderRadius: "8px"
    }}>
      <b>Winners:</b>
      {winners.map((w, i) => (
        <span key={i}> 🏆 {w.name}</span>
      ))}
    </div>
  );
}