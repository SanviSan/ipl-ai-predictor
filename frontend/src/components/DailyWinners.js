export default function DailyWinners({
  winners,
  loading,
}) {
  if (loading) {
    return <p>Loading daily winners...</p>;
  }

  if (!winners || winners.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h3>🏆 Today's Match Winners</h3>

      {winners.map((match) => (
        <div
          key={match.match_id}
          style={{
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom:
              "1px solid #eee",
          }}
        >
          <h4>
            ⚽ {match.match_name}
          </h4>

          <p>
            Score:{" "}
            <b>
              {match.team1_score} -{" "}
              {match.team2_score}
            </b>
          </p>

          <div>
            <b>🏆 Correct Winner:</b>

            {match.winners.length > 0 ? (
              <ul>
                {match.winners.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : (
              <p>No winners</p>
            )}
          </div>

          {match.exact_score_winners &&
            match.exact_score_winners.length >
              0 && (
              <div>
                <b>
                  ⭐ Exact Score (+10)
                </b>

                <ul>
                  {match.exact_score_winners.map(
                    (w) => (
                      <li key={w}>{w}</li>
                    )
                  )}
                </ul>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}