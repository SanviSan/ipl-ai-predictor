// src/pages/predict.js
import { useState } from "react";
import { TEAMS, VENUES, TOSS_DECISIONS } from "../constants";
import { fetchWithAuth } from "../api/api";

export default function Predict() {
  const [form, setForm] = useState({
    match_date: new Date().toISOString().split("T")[0],
    team1: TEAMS[0],
    team2: TEAMS[1],
    venue: VENUES[0],
    city: VENUES[0],
    toss_winner: TEAMS[0],
    toss_decision: TOSS_DECISIONS[0],
    season: new Date().getFullYear(),
    target_runs: 150,
    team1_player_count: 11,
    team2_player_count: 11,
    user_prediction: TEAMS[0],
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "match_date") {
      setForm(prev => ({ ...prev, season: new Date(value).getFullYear() }));
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    // Prepare payload matching backend schema
    const payload = {
      match_id: form.match_date, // optional, can use date or leave as null
      team1: form.team1,
      team2: form.team2,
      venue: form.venue,
      city: form.city,
      toss_winner: form.toss_winner,
      toss_decision: form.toss_decision,
      season: Number(form.season),
      target_runs: Number(form.target_runs),
      team1_player_count: Number(form.team1_player_count),
      team2_player_count: Number(form.team2_player_count),
      predicted_winner: form.user_prediction, // must match backend field
    };

    console.log("Payload sent to backend:", payload);
    console.log("Token in localStorage:", localStorage.getItem("authToken"));

    try {
      const res = await fetchWithAuth("/predict", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("Prediction response:", res);
      setResult(res);
    } catch (err) {
      console.error("Error from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Predict IPL Match</h2>

      <label>Match Date:</label>
      <input
        type="date"
        value={form.match_date}
        onChange={(e) => handleChange("match_date", e.target.value)}
      />

      <label>Team 1:</label>
      <select value={form.team1} onChange={(e) => handleChange("team1", e.target.value)}>
        {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
      </select>

      <label>Team 2:</label>
      <select value={form.team2} onChange={(e) => handleChange("team2", e.target.value)}>
        {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
      </select>

      <label>Venue:</label>
      <select value={form.venue} onChange={(e) => handleChange("venue", e.target.value)}>
        {VENUES.map(venue => <option key={venue} value={venue}>{venue}</option>)}
      </select>

      <label>City:</label>
      <select value={form.city} onChange={(e) => handleChange("city", e.target.value)}>
        {VENUES.map(city => <option key={city} value={city}>{city}</option>)}
      </select>

      <label>Toss Winner:</label>
      <select value={form.toss_winner} onChange={(e) => handleChange("toss_winner", e.target.value)}>
        {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
      </select>

      <label>Toss Decision:</label>
      <select value={form.toss_decision} onChange={(e) => handleChange("toss_decision", e.target.value)}>
        {TOSS_DECISIONS.map(decision => <option key={decision} value={decision}>{decision}</option>)}
      </select>

      <label>Your Prediction:</label>
      <select value={form.user_prediction} onChange={(e) => handleChange("user_prediction", e.target.value)}>
        {TEAMS.map(team => <option key={team} value={team}>{team}</option>)}
      </select>

      <label>Target Runs:</label>
      <input
        type="number"
        value={form.target_runs}
        onChange={(e) => handleChange("target_runs", Number(e.target.value))}
      />

      <label>Team 1 Player Count:</label>
      <input
        type="number"
        value={form.team1_player_count}
        onChange={(e) => handleChange("team1_player_count", Number(e.target.value))}
      />

      <label>Team 2 Player Count:</label>
      <input
        type="number"
        value={form.team2_player_count}
        onChange={(e) => handleChange("team2_player_count", Number(e.target.value))}
      />

      <button onClick={handlePredict} disabled={loading} style={{ marginTop: "10px" }}>
        {loading ? "Predicting..." : "Predict Winner"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <p>AI predicts: <b>{result.ai_winner}</b> with probability <b>{(result.ai_probability*100).toFixed(2)}%</b></p>
          <p>Your prediction: <b>{result.user_prediction}</b></p>
          <p>Points awarded: <b>{result.points_awarded}</b></p>
        </div>
      )}
    </div>
  );
}