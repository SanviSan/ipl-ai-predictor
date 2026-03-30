import { useEffect, useState } from "react";
import { API_URL } from "../api/api";

export default function NonVoters({ matchId }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/matches/${matchId}/non-voters`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, [matchId]);

  if (!users.length) return null;

  return (
    <div style={{
      marginTop: "10px",
      background: "#fff3cd",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ffeeba"
    }}>
      <b>⏳ Not yet voted:</b>
      {users.map((u, i) => (
        <span key={i}> {u.name}{i < users.length - 1 ? "," : ""}</span>
      ))}
    </div>
  );
}