import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# -------------------------------
# LOAD DATA
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "data", "ipl_history.csv")

df = pd.read_csv(file_path)

print(f"Loaded {len(df)} rows")

# -------------------------------
# CLEAN DATA
# -------------------------------
df = df.dropna(subset=["team1", "team2", "winner"])

# -------------------------------
# PRECOMPUTE TEAM STATS (FAST)
# -------------------------------

# Total matches played
team_matches = pd.concat([df["team1"], df["team2"]]).value_counts()

# Total wins
team_wins = df["winner"].value_counts()

# Win rate
team_win_rate = (team_wins / team_matches).fillna(0)

# -------------------------------
# PRECOMPUTE HEAD-TO-HEAD (FAST)
# -------------------------------

# Create matchup key (sorted teams)
df["matchup"] = df.apply(
    lambda x: "_".join(sorted([x["team1"], x["team2"]])),
    axis=1
)

# Count total matches per matchup
matchup_counts = df["matchup"].value_counts()

# Count wins per matchup (for team1 perspective)
h2h_data = {}

for matchup, count in matchup_counts.items():
    subset = df[df["matchup"] == matchup]

    t1, t2 = matchup.split("_")

    t1_wins = len(subset[subset["winner"] == t1])
    h2h_data[matchup] = t1_wins / count if count > 0 else 0.5

# -------------------------------
# BUILD TRAINING DATA (FAST)
# -------------------------------

df_model = pd.DataFrame({
    "team1_strength": df["team1"].map(team_win_rate),
    "team2_strength": df["team2"].map(team_win_rate),
    "h2h": df["matchup"].map(h2h_data),
    "target": (df["winner"] == df["team1"]).astype(int)
})

# -------------------------------
# TRAIN MODEL
# -------------------------------

X = df_model[["team1_strength", "team2_strength", "h2h"]]
y = df_model["target"]

print("Training model...")

model = RandomForestClassifier(
    n_estimators=50,      # reduced for speed
    max_depth=6,          # prevents overfitting
    random_state=42
)

model.fit(X, y)

# -------------------------------
# SAVE MODEL
# -------------------------------

model_path = os.path.join(BASE_DIR, "data", "ipl_model_v2.pkl")
joblib.dump(model, model_path)

print("✅ Model trained and saved!")