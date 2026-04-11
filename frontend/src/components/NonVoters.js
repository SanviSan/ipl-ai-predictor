import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function NonVoters({ matchId }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWithAuth(
          `/matches/${matchId}/non-voters`
        );
        setUsers(data);
      } catch (err) {
        console.error("Non voters error:", err);
        setUsers([]);
      }
    };

    load();
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
        <span key={i}>
          {" "} {u.name}{i < users.length - 1 ? "," : ""}
        </span>
      ))}
    </div>
  );
}