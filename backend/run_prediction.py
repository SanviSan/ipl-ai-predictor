from predict_match import predict

winner = predict(
    team1="RCB",
    team2="PBKS",
    venue="Bengaluru",
    city="Bengaluru",
    toss_winner="RCB",
    toss_decision="bat",
    season=2026,
    target_runs=150,
    team1_player_count=11,
    team2_player_count=11
)

print("Predicted Winner:", winner)