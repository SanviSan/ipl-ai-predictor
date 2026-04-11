# backend/main.py
from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
import logging

from backend.database import SessionLocal, engine, Base
from backend import schemas
from backend.models import User, Match, Prediction, Team
from backend.schemas import MatchResultUpdate
from backend.auth import router as auth_router
from backend.predict_match import predict_winner

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.include_router(auth_router, prefix="/auth")

SECRET = "SUPER_SECRET"

logging.basicConfig(level=logging.INFO)
print("🔥🔥🔥 MAIN.PY LOADED 🔥🔥🔥")

print("🔥 RUNNING FILE:", __file__)

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ipl-ai-predictor-ui.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DB SESSION
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# AUTH HELPERS
# -------------------------
def get_current_user(authorization: str = Header(None)):
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing token")

        token = authorization.split(" ")[1]

        payload = jwt.decode(token, SECRET, algorithms=["HS256"])

        return {
            "user_id": payload.get("user_id")
        }

    except Exception:
        logging.exception("JWT decode error")
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_admin(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user["user_id"]).first()

    if not db_user or not db_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return db_user


# -------------------------
# LOGIN
# -------------------------
@app.post("/auth/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {
            "user_id": db_user.id,
            "group_id": db_user.group_id
        },
        SECRET,
        algorithm="HS256"
    )

    return {
        "token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "group_id": db_user.group_id
        }
    }

# -------------------------
# MATCHES
# -------------------------
@app.get("/matches/upcoming")
def get_upcoming_matches(db: Session = Depends(get_db)):
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

    matches = db.query(Match).filter(
        Match.status == "scheduled",
        Match.match_date >= start,
        Match.match_date < end
    ).all()

    IST = timezone(timedelta(hours=5, minutes=30))

    result = []

    for match in matches:
        team1 = db.query(Team).filter(Team.id == match.team1_id).first()
        team2 = db.query(Team).filter(Team.id == match.team2_id).first()

        match_datetime_utc = match.match_date.replace(tzinfo=IST).astimezone(timezone.utc)

        result.append({
            "match_id": match.id,
            "match_date": match.match_date.isoformat(),
            "match_datetime": match_datetime_utc.isoformat(),
            "team1": {"id": team1.id, "short": team1.short_name},
            "team2": {"id": team2.id, "short": team2.short_name},
            "venue": getattr(match, "venue", "TBD"),
            "ai_prediction_team_id": match.team1_id,
            "ai_probability": 0.6
        })

    return result

# -------------------------
# PREDICT
# -------------------------
@app.post("/predict")
def predict(
    prediction: schemas.PredictionCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == prediction.match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status == "completed":
        raise HTTPException(status_code=400, detail="Match completed")

    now = datetime.utcnow() + timedelta(hours=5, minutes=30)

    if match.match_date <= now:
        raise HTTPException(status_code=400, detail="Prediction closed")

    existing = db.query(Prediction).filter(
        Prediction.user_id == user["user_id"],
        Prediction.match_id == prediction.match_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already predicted")

    db.add(Prediction(
        user_id=user["user_id"],
        match_id=prediction.match_id,
        predicted_team_id=prediction.predicted_team_id,
        points_awarded=0
    ))

    db.commit()

    return {"message": "Prediction saved"}

# -------------------------
# RESULT (ADMIN + NR SUPPORT)
# -------------------------
@app.post("/matches/{match_id}/result")
def update_match_result(
    match_id: int,
    result: MatchResultUpdate,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # -------------------------
    # NR (No Result)
    # -------------------------
    if result.winner_team_id is None:
        match.status = "completed"
        match.winner_team_id = None
        db.commit()
        return {"message": "No Result marked"}

    match.status = "completed"
    match.winner_team_id = result.winner_team_id

    users = db.query(User).filter(User.group_id == admin.group_id).all()
    predictions = db.query(Prediction).filter(Prediction.match_id == match_id).all()

    pred_map = {p.user_id: p for p in predictions}

    for u in users:
        p = pred_map.get(u.id)

        if p:
            if p.predicted_team_id == result.winner_team_id:
                p.points_awarded = 10
            else:
                p.points_awarded = -5
            u.points += p.points_awarded
        else:
            u.points -= 5

    db.commit()

    return {"message": "Result updated"}

# -------------------------
# WINNERS (FIXED)
# -------------------------
@app.get("/matches/{match_id}/winners")
def match_winners(match_id: int, db: Session = Depends(get_db)):
    preds = db.query(Prediction).filter(
        Prediction.match_id == match_id,
        Prediction.points_awarded > 0
    ).all()

    return [
        {
            "name": db.query(User).filter(User.id == p.user_id).first().name,
            "points": p.points_awarded
        }
        for p in preds
    ]

# -------------------------
# NON-VOTERS (FIXED)
# -------------------------
@app.get("/matches/{match_id}/non-voters")
def non_voters(match_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user["user_id"]).first()
    group_id = db_user.group_id
    users = db.query(User).filter(User.group_id == group_id).all()

    voted = db.query(Prediction).filter(Prediction.match_id == match_id).all()
    voted_ids = {v.user_id for v in voted}

    return [{"name": u.name} for u in users if u.id not in voted_ids]

# -------------------------
# LEADERBOARD
# -------------------------
@app.get("/leaderboard")
def leaderboard(user=Depends(get_current_user), db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.id == user["user_id"]).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")

    # ✅ ADMIN CAN SEE ALL GROUPS
    if db_user.is_admin:
        users = db.query(User).order_by(User.points.desc()).all()
    else:
        users = db.query(User).filter(
            User.group_id == db_user.group_id
        ).order_by(User.points.desc()).all()

    return [
        {"name": u.name, "points": u.points}
        for u in users
    ]

# -------------------------
# DAILY WINNERS (FIXED)
# -------------------------
@app.get("/leaderboard/daily")
def daily_winners(user=Depends(get_current_user), db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.id == user["user_id"]).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")

    latest = (
        db.query(Match)
        .filter(Match.status == "completed")
        .order_by(Match.match_date.desc())
        .first()
    )

    if not latest:
        return []

    match_date = latest.match_date.date()

    matches = db.query(Match).filter(
        Match.status == "completed",
        Match.match_date >= datetime.combine(match_date, datetime.min.time())
    ).all()

    match_ids = [m.id for m in matches]

    # 🔥 preload ALL users once (BIG FIX)
    users = db.query(User).all()
    user_map = {u.id: u for u in users}

    predictions = db.query(Prediction).filter(
        Prediction.match_id.in_(match_ids)
    ).all()

    points = {}

    for p in predictions:
        u = user_map.get(p.user_id)

        if not u:
            continue

        # 👇 group filter logic
        if not db_user.is_admin and u.group_id != db_user.group_id:
            continue

        points[p.user_id] = points.get(p.user_id, 0) + p.points_awarded

    if not points:
        return []

    max_pts = max(points.values())

    return [
        {
            "name": user_map[uid].name,
            "points": pts
        }
        for uid, pts in points.items()
        if pts == max_pts
    ]