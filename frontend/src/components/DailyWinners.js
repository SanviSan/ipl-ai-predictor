export default function DailyWinners({ winners, loading }) {

  if (loading) return null;
  if (!winners || winners.length === 0) return null;

  return (
    <div
      style={{
        background: "#fff",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h3>🏆 Daily Winners</h3>

      {winners.map((w, i) => (
        <p key={i}>
          🥇 <b>{w.name}</b> ({w.points} pts)
        </p>
      ))}
    </div>
  );
}