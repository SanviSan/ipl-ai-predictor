// src/components/DailyWinners.js
import { useEffect, useState } from "react";
import { API_URL } from "../api/api";

export default function DailyWinners() {
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard/daily`)
      .then(res => res.json())
      .then(data => setWinners(data))
      .catch(err => console.error(err));
  }, []);

  if (!winners.length) return null;

  return (
    <div style={{
      background: "#fff",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "20px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
    }}>
      <h3>🏆 Daily Winners</h3>

      {winners.map((w, i) => (
        <p key={i}>
          🥇 <b>{w.name}</b> ({w.points} pts)
        </p>
      ))}
    </div>
  );
}