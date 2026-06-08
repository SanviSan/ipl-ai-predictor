import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function FifaWinnerPrediction() {
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await fetchWithAuth("/teams?tournament=FIFA WC 2026"); // assume exists
        setTeams(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load teams");
      }
    };

    loadTeams();
  }, []);

  const submitPrediction = async () => {
    if (!selected) return;

    try {
      setLoading(true);
      setError("");

      await fetchWithAuth("/fifa/predict-winner", {
        method: "POST",
        body: JSON.stringify({ team_id: selected }),
      });

      setSaved(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🏆 FIFA World Cup Winner Prediction</h2>

      <p style={{ color: "#666" }}>
        Select the team you think will win the World Cup (+100 points)
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {saved ? (
        <div style={styles.success}>
          ✅ Prediction saved successfully!
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {teams.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                style={{
                  ...styles.card,
                  border:
                    selected === t.id
                      ? "3px solid #007bff"
                      : "1px solid #ddd",
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {t.short_name } - {t.name}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitPrediction}
            disabled={!selected || loading}
            style={{
              ...styles.button,
              opacity: !selected || loading ? 0.5 : 1,
              cursor: !selected || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit Prediction"}
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "auto",
    padding: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
    marginTop: "20px",
  },

  card: {
    padding: "15px",
    borderRadius: "10px",
    background: "#fff",
    cursor: "pointer",
    textAlign: "center",
  },

  button: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
  },

  success: {
    marginTop: "20px",
    padding: "15px",
    background: "#d4edda",
    color: "#155724",
    borderRadius: "8px",
  },
};