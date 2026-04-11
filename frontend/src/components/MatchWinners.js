// src/components/MatchWinners.js
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function MatchWinners({ matchId }) {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWithAuth(`/matches/${matchId}/winners`);
        setWinners(data);
      } catch (err) {
        console.error("Match winners error:", err);
      }
    };

    load();
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