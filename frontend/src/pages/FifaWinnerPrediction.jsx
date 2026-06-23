import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/api";

export default function FifaWinnerPrediction() {
  const [teams, setTeams] = useState([]);

  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await fetchWithAuth(
          "/teams?tournament=FIFA WC 2026"
        );

        setTeams(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load teams");
      }
    };

    loadTeams();
  }, []);

  const submitPrediction = async () => {

    if (!champion || !runnerUp || !thirdPlace) {
      setError("Please select all three positions");
      return;
    }

    if (
      champion === runnerUp ||
      champion === thirdPlace ||
      runnerUp === thirdPlace
    ) {
      setError(
        "Champion, Runner Up and Third Place must be different teams"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await fetchWithAuth("/fifa/predict-winner", {
        method: "POST",
        body: JSON.stringify({
          champion_team_id: Number(champion),
          runner_up_team_id: Number(runnerUp),
          third_place_team_id: Number(thirdPlace),
        }),
      });

      setSaved(true);

    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to submit prediction"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (id) => {
    const team = teams.find(
      (t) => t.id === Number(id)
    );

    return team
      ? `${team.short_name} - ${team.name}`
      : "";
  };

  return (
    <div style={styles.container}>
      <h2>🏆 FIFA World Cup Tournament Prediction</h2>

      <p style={styles.subtitle}>
        Predict the final podium before the Round of 16 begins.
      </p>

      <div style={styles.pointsBox}>
        <h4>Points Available</h4>

        <p>🏆 Champion = 100 pts</p>
        <p>🥈 Runner Up = 50 pts</p>
        <p>🥉 Third Place = 25 pts</p>

        <hr />

        <b>Maximum = 175 points</b>
      </div>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {saved ? (
        <div style={styles.success}>
          <h3>✅ Prediction Saved</h3>

          <p>
            🏆 {getTeamName(champion)}
          </p>

          <p>
            🥈 {getTeamName(runnerUp)}
          </p>

          <p>
            🥉 {getTeamName(thirdPlace)}
          </p>
        </div>
      ) : (
        <>
          {/* Champion */}

          <div style={styles.field}>
            <label>🏆 Champion</label>

            <select
              value={champion}
              onChange={(e) =>
                setChampion(e.target.value)
              }
              style={styles.select}
            >
              <option value="">
                Select Champion
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.short_name} - {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Runner Up */}

          <div style={styles.field}>
            <label>🥈 Runner Up</label>

            <select
              value={runnerUp}
              onChange={(e) =>
                setRunnerUp(e.target.value)
              }
              style={styles.select}
            >
              <option value="">
                Select Runner Up
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.short_name} - {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Third Place */}

          <div style={styles.field}>
            <label>🥉 Third Place</label>

            <select
              value={thirdPlace}
              onChange={(e) =>
                setThirdPlace(e.target.value)
              }
              style={styles.select}
            >
              <option value="">
                Select Third Place
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.short_name} - {team.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={submitPrediction}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading
              ? "Saving..."
              : "Save Prediction"}
          </button>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "700px",
    margin: "auto",
    padding: "20px",
  },

  subtitle: {
    color: "#666",
    marginBottom: "20px",
  },

  pointsBox: {
    background: "#f8f9fa",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  field: {
    marginBottom: "20px",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },

  button: {
    width: "100%",
    padding: "12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  success: {
    background: "#d4edda",
    padding: "20px",
    borderRadius: "10px",
    color: "#155724",
  },
};