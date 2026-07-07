import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function TournamentPredictions() {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWithAuth(
          "/fifa/tournament-predictions"
        );

        setPredictions(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  if (!predictions.length) return null;

  const TeamCell = ({ team }) => (
    <div style={styles.teamCell}>
      <img
        src={`/team-logos/${team}.png`}
        alt={team}
        style={styles.logo}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
      <span>{team}</span>
    </div>
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        🏆 FIFA Tournament Predictions
      </h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.header}>User</th>
            <th style={styles.header}>🏆 Champion</th>
            <th style={styles.header}>🥈 Runner Up</th>
            <th style={styles.header}>🥉 Third Place</th>
          </tr>
        </thead>

        <tbody>
          {predictions.map((p, index) => (
            <tr key={index}>
              <td style={styles.cell}>
                <strong>{p.user}</strong>
              </td>

              <td style={styles.cell}>
                <TeamCell team={p.champion} />
              </td>

              <td style={styles.cell}>
                <TeamCell team={p.runner_up} />
              </td>

              <td style={styles.cell}>
                <TeamCell team={p.third_place} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    marginTop: "30px",
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    overflowX: "auto",
  },

  title: {
    marginBottom: "15px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },

  header: {
    background: "#007bff",
    color: "#fff",
    padding: "12px",
    border: "1px solid #ddd",
    textAlign: "left",
  },

  cell: {
    padding: "12px",
    border: "1px solid #ddd",
    verticalAlign: "middle",
  },

  teamCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "26px",
    height: "26px",
    objectFit: "contain",
  },
};