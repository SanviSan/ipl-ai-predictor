import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function FifaStandings() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetchWithAuth("/fifa/standings");
        setData(res || {});
      } catch (err) {
        console.error(err);
        setError("Failed to load FIFA standings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <p>Loading FIFA standings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
      <h2>⚽ FIFA World Cup Group Standings</h2>

      {Object.keys(data).length === 0 && (
        <p>No standings available yet</p>
      )}

      {Object.entries(data).map(([groupName, teams]) => (
        <div
          key={groupName}
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "12px",
            background: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {/* Group Title */}
          <h3 style={{ marginBottom: "10px" }}>{groupName}</h3>

          {/* Header */}
          <div style={styles.rowHeader}>
            <span>Team</span>
            <span>P</span>
            <span>W</span>
            <span>Pts</span>
            <span>Status</span>
          </div>

          {/* Teams */}
          {teams.map((t, index) => {
            const isQualified = index < 2; // TOP 2 QUALIFY

            return (
              <div key={t.team_id} style={styles.row}>
                {/* Team */}
                <span style={{ fontWeight: "bold" }}>
                  {t.team}
                </span>

                {/* Played */}
                <span>{t.played}</span>

                {/* Wins */}
                <span>{t.wins}</span>

                {/* Points */}
                <span style={{ color: "#007bff", fontWeight: "bold" }}>
                  {t.points}
                </span>

                {/* Qualification */}
                <span
                  style={{
                    fontWeight: "bold",
                    color: isQualified ? "green" : "red",
                  }}
                >
                  {isQualified ? "🏆 Qualified" : "❌ Eliminated"}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Styles
const styles = {
  rowHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
    fontWeight: "bold",
    padding: "8px 0",
    borderBottom: "2px solid #ddd",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
    alignItems: "center",
  },
};