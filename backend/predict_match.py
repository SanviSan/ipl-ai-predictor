import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = joblib.load(os.path.join(BASE_DIR, "data", "ipl_model_v2.pkl"))
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
df = pd.read_csv(os.path.join(BASE_DIR, "data", "ipl_history.csv"))

# Precompute stats
team_wins = df['winner'].value_counts().to_dict()
team_matches = pd.concat([df['team1'], df['team2']]).value_counts().to_dict()

def get_win_rate(team):
    return team_wins.get(team, 0) / team_matches.get(team, 1)

def get_h2h(team1, team2):
    matches = df[((df.team1 == team1) & (df.team2 == team2)) |
                 ((df.team1 == team2) & (df.team2 == team1))]

    if len(matches) == 0:
        return 0.5

    wins = matches[matches['winner'] == team1]
    return len(wins) / len(matches)

def predict_winner(team1, team2):
    t1_strength = get_win_rate(team1)
    t2_strength = get_win_rate(team2)
    h2h = get_h2h(team1, team2)

    X = pd.DataFrame([{
        "team1_strength": t1_strength,
        "team2_strength": t2_strength,
        "h2h": h2h
    }])

    prob = model.predict_proba(X)[0][1]

    # ✅ IMPORTANT: Smooth probabilities
    prob = max(0.55, min(0.75, prob))

    if model:
        if prob >= 0.5:
            return team1, prob
        else:
            return team2, 1 - prob
    else:
        return team1, 0.6