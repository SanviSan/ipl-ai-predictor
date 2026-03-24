import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Load the dataset
df = pd.read_csv('../ipl_history.csv')

# Convert players lists into counts
df["team1_player_count"] = df["team1_players"].apply(lambda x: len(str(x).split(",")))
df["team2_player_count"] = df["team2_players"].apply(lambda x: len(str(x).split(",")))

# Convert season and target_runs to numeric
df["season"] = pd.to_numeric(df["season"], errors="coerce")
df["target_runs"] = pd.to_numeric(df["target_runs"], errors="coerce")

# Drop rows with missing values
df = df.dropna(subset=["winner", "season", "target_runs"])

# Encode categorical columns
categorical_cols = [
    "team1",
    "team2",
    "venue",
    "city",
    "toss_winner",
    "toss_decision",
    "winner"
]

encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

# Select features
features = [
    "team1",
    "team2",
    "venue",
    "city",
    "toss_winner",
    "toss_decision",
    "season",
    "target_runs",
    "team1_player_count",
    "team2_player_count"
]

X = df[features]
y = df["winner"]

# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train the classifier
model = RandomForestClassifier(n_estimators=500, max_depth=10, random_state=42)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.2f}")

# Save the model and encoders
joblib.dump(model, "ipl_model.pkl")
joblib.dump(encoders, "ipl_encoders.pkl")

print("Model and encoders saved successfully.")