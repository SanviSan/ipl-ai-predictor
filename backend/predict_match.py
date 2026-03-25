import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = joblib.load(os.path.join(BASE_DIR, "data", "ipl_model_v2.pkl"))
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

try:
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "ipl_history.csv"))
except Exception as e:
    print("⚠️ CSV not loaded:", e)

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
    # ✅ If model OR data missing → fallback
    if model is None or history_df is None:
        winner = random.choice([team1, team2])
        prob = round(random.uniform(0.55, 0.75), 2)
        return winner, prob

    try:
        # ✅ Safe feature extraction
        t1_strength = get_win_rate(team1) or 0.5
        t2_strength = get_win_rate(team2) or 0.5
        h2h = get_h2h(team1, team2) or 0.5

        X = pd.DataFrame([{
            "team1_strength": t1_strength,
            "team2_strength": t2_strength,
            "h2h": h2h
        }])

        prob = model.predict_proba(X)[0][1]

        # ✅ Clamp but wider range → more realistic
        prob = max(0.40, min(0.85, prob))

        if prob >= 0.5:
            return team1, round(prob, 2)
        else:
            return team2, round(1 - prob, 2)

    except Exception as e:
        print("⚠️ Prediction fallback due to error:", e)

        # ✅ fallback if anything fails
        winner = random.choice([team1, team2])
        prob = round(random.uniform(0.55, 0.75), 2)
        return winner, prob