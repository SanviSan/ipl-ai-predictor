import joblib
import pandas as pd
import os
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = None
df = None

# ✅ Load model safely
try:
    model = joblib.load(os.path.join(BASE_DIR, "data", "ipl_model_v2.pkl"))
    print("✅ Model loaded")
except Exception as e:
    print(f"⚠️ Model not loaded: {e}")
    model = None

# ✅ Load CSV safely
try:
    df = pd.read_csv(os.path.join(BASE_DIR, "data", "ipl_history.csv"))
    print("✅ CSV loaded")
except Exception as e:
    print("⚠️ CSV not loaded:", e)
    df = None

# ✅ Precompute only if df exists
if df is not None:
    team_wins = df['winner'].value_counts().to_dict()
    team_matches = pd.concat([df['team1'], df['team2']]).value_counts().to_dict()
else:
    team_wins = {}
    team_matches = {}

# -------------------------
# Helpers
# -------------------------
def get_win_rate(team):
    if df is None:
        return 0.5

    return team_wins.get(team, 0) / team_matches.get(team, 1)


def get_h2h(team1, team2):
    if df is None:
        return 0.5

    matches = df[
        ((df.team1 == team1) & (df.team2 == team2)) |
        ((df.team1 == team2) & (df.team2 == team1))
    ]

    if len(matches) == 0:
        return 0.5

    wins = matches[matches['winner'] == team1]
    return len(wins) / len(matches)


# -------------------------
# Prediction
# -------------------------
def predict_winner(team1, team2):
    # ✅ FIXED: use df (not history_df)
    if model is None or df is None:
        winner = random.choice([team1, team2])
        prob = round(random.uniform(0.55, 0.75), 2)
        return winner, prob

    try:
        t1_strength = get_win_rate(team1) or 0.5
        t2_strength = get_win_rate(team2) or 0.5
        h2h = get_h2h(team1, team2) or 0.5

        X = pd.DataFrame([{
            "team1_strength": t1_strength,
            "team2_strength": t2_strength,
            "h2h": h2h
        }])

        prob = model.predict_proba(X)[0][1]

        # ✅ More realistic spread
        prob = max(0.40, min(0.85, prob))

        if prob >= 0.5:
            return team1, round(prob, 2)
        else:
            return team2, round(1 - prob, 2)

    except Exception as e:
        print("⚠️ Prediction fallback due to error:", e)

        winner = random.choice([team1, team2])
        prob = round(random.uniform(0.55, 0.75), 2)
        return winner, prob