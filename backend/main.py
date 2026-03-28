# backend/main.py
from fastapi import FastAPI, Depends, Header, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging

from backend.database import SessionLocal, engine, Base, get_db
from backend.auth import router as auth_router
from backend.schemas import MatchResultUpdate
from backend.models import Prediction, User, Match, Team
from jose import jwt
from fastapi.middleware.cors import CORSMiddleware
from backend import schemas
from backend.predict_match import predict_winner


app = FastAPI()

# auto create tables based on models
Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth")

SECRET = "SUPER_SECRET"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ipl-ai-predictor-ui.onrender.com"   # 👈 ADD THIS
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DB Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# AUTH - REGISTER
# -------------------------
@app.post("/auth/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=user.password  # (later hash this)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

@app.get("/leaderboard/daily")
def daily_winners(db: Session = Depends(get_db)):
    try:
        # Get latest completed match date
        latest_match = (
            db.query(Match)
            .filter(Match.status == "completed")
            .order_by(Match.match_date.desc())
            .first()
        )

        if not latest_match:
            return []

        match_date = latest_match.match_date

        # Get all matches on that date
        matches = db.query(Match).filter(
            Match.match_date == match_date,
            Match.status == "completed"
        ).all()

        match_ids = [m.id for m in matches]

        # Get predictions for those matches
        predictions = db.query(Prediction).filter(
            Prediction.match_id.in_(match_ids)
        ).all()

        # Calculate points per user for that day
        user_points = {}

        for p in predictions:
            user_points[p.user_id] = user_points.get(p.user_id, 0) + p.points_awarded

        if not user_points:
            return []

        max_points = max(user_points.values())

        winners = []

        for user_id, points in user_points.items():
            if points == max_points:
                user = db.query(User).filter(User.id == user_id).first()
                winners.append({
                    "name": user.name,
                    "points": points
                })

        return winners

    except Exception as e:
        logging.error(f"Daily leaderboard error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching daily winners")
    
@app.get("/matches/{match_id}/winners")
def match_winners(match_id: int, db: Session = Depends(get_db)):
    try:
        predictions = db.query(Prediction).filter(
            Prediction.match_id == match_id,
            Prediction.points_awarded > 0
        ).all()

        winners = []

        for p in predictions:
            user = db.query(User).filter(User.id == p.user_id).first()
            winners.append({
                "name": user.name,
                "points": p.points_awarded
            })

        return winners

    except Exception as e:
        logging.error(f"Match winners error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching match winners")

# -------------------------
# AUTH - LOGIN
# -------------------------
@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode({"user_id": db_user.id}, SECRET, algorithm="HS256")

    # Ensure is_admin is proper bool
    is_admin_flag = bool(db_user.is_admin)

    print(f"💡 Login attempt: {db_user.email}, is_admin: {is_admin_flag}", flush=True)

    print("DB user:", db_user)

    # Also log to INFO so you can check in logs
    logging.info(f"💡 Login attempt: {db_user.email}, is_admin: {is_admin_flag}")

    #return {"token": token, "token_type": "bearer", "is_admin": is_admin_flag}
    # DEBUG: return full user info
    return {
        "token": token,
        "token_type": "bearer",
        "is_admin": bool(db_user.is_admin),
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "is_admin": db_user.is_admin
        }
    }

# -------------------------
# GET CURRENT USER
# -------------------------
def get_current_user(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return payload.get("user_id")
    except Exception as e:
        logging.error(f"Token error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# -------------------------
# GET UPCOMING MATCHES
# -------------------------
# backend/main.py

@app.get("/matches/upcoming")
def get_upcoming_matches(db: Session = Depends(get_db)):
    try:
        # Step 1: get first upcoming match
        next_match = (
            db.query(Match)
            .filter(Match.status == "scheduled")
            .order_by(Match.match_date.asc())
            .first()
        )

        if not next_match:
            return []

        next_date = next_match.match_date.date()

        start = datetime.combine(next_date, datetime.min.time())
        end = start + timedelta(days=1)

        matches = (
            db.query(Match)
            .filter(
                Match.status == "scheduled",
                Match.match_date >= start,
                Match.match_date < end
            )
            .all()
        )

        result = []

        for match in matches:
            team1 = db.query(Team).filter(Team.id == match.team1_id).first()
            team2 = db.query(Team).filter(Team.id == match.team2_id).first()

            IST = timezone(timedelta(hours=5, minutes=30))

            # Convert IST → UTC safely
            match_datetime_utc = match.match_date.replace(tzinfo=IST).astimezone(timezone.utc)


            result.append({
                "match_id": match.id,

                # Keep for display
                "match_date": match.match_date.isoformat(),

                # 🆕 ADD THIS (used for locking + countdown)
               "match_datetime": match_datetime_utc.isoformat(),

                "team1": {
                    "id": team1.id,
                    "short": team1.short_name
                } if team1 else None,

                "team2": {
                    "id": team2.id,
                    "short": team2.short_name
                } if team2 else None,

                "venue": getattr(match, "venue", "TBD"),

                "ai_prediction_team_id": match.team1_id,
                "ai_probability": 0.6
            })

        return result

    except Exception as e:
        logging.error(f"Error fetching matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to load matches")

# -------------------------
# AI PREDICTION (based on histroical data, not user input)
# -------------------------
def get_ai_prediction(match, db):
    team1 = db.query(Team).filter(Team.id == match.team1_id).first()
    team2 = db.query(Team).filter(Team.id == match.team2_id).first()

    if not team1 or not team2:
        return {
            "winner_team_id": match.team1_id,
            "probability": 0.5
        }

    # ✅ Correct unpacking
    winner_short, probability = predict_winner(
        team1.short_name,
        team2.short_name
    )

    # Map short name → team_id
    if winner_short == team1.short_name:
        winner_id = team1.id
    else:
        winner_id = team2.id

    return {
        "winner_team_id": winner_id,
        "probability": probability or 0.5
    }

# -------------------------
# PREDICT
# -------------------------
from datetime import datetime

@app.post("/predict")
def predict(
    prediction: schemas.PredictionCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == prediction.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # ❌ Block if already completed
    if match.status == "completed":
        raise HTTPException(status_code=400, detail="Match already completed")

    # 🆕 BLOCK if match already started
    now = datetime.utcnow() + timedelta(hours=5, minutes=30)

    # If you're still using match_date column (TIMESTAMP)
    if match.match_date <= now:
        raise HTTPException(
            status_code=400,
            detail="Prediction closed (match already started)"
        )

    # ❌ Prevent duplicate prediction
    existing = db.query(Prediction).filter(
        Prediction.user_id == user_id,
        Prediction.match_id == prediction.match_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already predicted")

    # 🤖 AI prediction
    ai_result = get_ai_prediction(match, db)

    new_prediction = Prediction(
        user_id=user_id,
        match_id=prediction.match_id,
        predicted_team_id=prediction.predicted_team_id,
        points_awarded=0
    )

    db.add(new_prediction)
    db.commit()

    team = db.query(Team).filter(Team.id == ai_result["winner_team_id"]).first()

    return {
        "message": "Prediction saved",
        "ai_winner": team.short_name if team else "N/A",
        "probability": ai_result["probability"],
        "points_awarded": 0
    }

# -------------------------
# USER PREDICTIONS
# -------------------------
@app.get("/predictions/me")
def my_predictions(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    preds = db.query(Prediction).filter(Prediction.user_id == user_id).all()

    result = []
    for p in preds:
        match = db.query(Match).filter(Match.id == p.match_id).first()
        team = db.query(Team).filter(Team.id == p.predicted_team_id).first()

        result.append({
            "match_id": match.id,
            "prediction": team.short_name,
            "points": p.points_awarded
        })

    return result



def get_current_admin(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user


@app.post("/matches/{match_id}/result")
def update_match_result(
    match_id: int,
    result: MatchResultUpdate,
    admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status == "completed":
        raise HTTPException(status_code=400, detail="Already completed")

    # ✅ Update match
    winner_team_id = result.winner_team_id
    match.status = "completed"
    match.winner_team_id = winner_team_id

    # ✅ NEW LOGIC HERE 👇
    all_users = db.query(User).all()

    predictions = db.query(Prediction).filter(
        Prediction.match_id == match_id
    ).all()

    pred_dict = {p.user_id: p for p in predictions}

    for user in all_users:
        pred = pred_dict.get(user.id)

        if pred:
            if pred.predicted_team_id == winner_team_id:
                pred.points_awarded = 10
            else:
                pred.points_awarded = -5

            user.points += pred.points_awarded

        else:
            # ❌ No prediction → penalty
            user.points -= 5

    db.commit()

    return {"message": "Match result updated & points calculated"}


# -------------------------
# LEADERBOARD
# -------------------------
@app.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.points.desc()).all()

    return [
        {"name": u.name, "points": u.points}
        for u in users
    ]