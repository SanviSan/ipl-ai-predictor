# backend/main.py
from fastapi import FastAPI, Depends, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
import logging

from backend.database import SessionLocal, engine, Base
from backend import schemas
from backend.models import User, Match, Prediction, Team,TournamentPrediction
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

FIFA_PREDICTION_LOCK_DATE = datetime(
    2026,
    7,
    4,
    0,
    0,
    0,
    tzinfo=timezone.utc
)

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

    matches = (
        db.query(Match)
        .filter(
            Match.status == "scheduled",
            Match.match_date >= start,
            Match.match_date < end
        )
        .order_by(Match.match_date.asc())
        .all()
    )

    IST = timezone(timedelta(hours=5, minutes=30))

    result = []

    for match in matches:

        team1 = db.query(Team).filter(
            Team.id == match.team1_id
        ).first()

        team2 = db.query(Team).filter(
            Team.id == match.team2_id
        ).first()

        match_datetime_utc = (
            match.match_date
            .replace(tzinfo=IST)
            .astimezone(timezone.utc)
        )

        result.append({
            "match_id": match.id,

            "match_date": match.match_date.isoformat(),

            "match_datetime": match_datetime_utc.isoformat(),

            "team1": {
                "id": team1.id,
                "short": team1.short_name,
                "name": team1.name
            },

            "team2": {
                "id": team2.id,
                "short": team2.short_name,
                "name": team2.name
            },

            "venue": getattr(match, "venue", "TBD"),

            # IMPORTANT FOR FIFA
            "sport": match.sport,
            "tournament": match.tournament,
            "stage": match.stage,
            "group_name": getattr(match, "group_name", None),

            # AI placeholders
            "ai_prediction_team_id": match.team1_id,
            "ai_probability": 0.60
        })

    return result

# -------------------------
# PREDICT
# -------------------------
@app.post("/predict")
def predict(
    pred: schemas.PredictionCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.id == user["user_id"]
    ).first()

    match = db.query(Match).filter(
        Match.id == pred.match_id
    ).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail="Match not found"
        )

    # -----------------------------------
    # SCORE VALIDATION
    # -----------------------------------
    if (
        pred.predicted_home_score is not None
        and pred.predicted_away_score is not None
    ):

        home = pred.predicted_home_score
        away = pred.predicted_away_score

        # DRAW
        if pred.is_draw:

            if home != away:
                raise HTTPException(
                    status_code=400,
                    detail="Draw prediction requires equal scores"
                )

        # TEAM 1 WIN
        elif pred.predicted_team_id == match.team1_id:

            if home <= away:
                raise HTTPException(
                    status_code=400,
                    detail=f"{match.team1.name} win prediction requires team1 score > team2 score"
                )

        # TEAM 2 WIN
        elif pred.predicted_team_id == match.team2_id:

            if away <= home:
                raise HTTPException(
                    status_code=400,
                    detail=f"{match.team2.name} win prediction requires team2 score > team1 score"
                )

    # -----------------------------------
    # EXISTING PREDICTION CHECK
    # -----------------------------------
    existing = db.query(Prediction).filter(
        Prediction.user_id == db_user.id,
        Prediction.match_id == pred.match_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Already predicted"
        )

    prediction = Prediction(
        user_id=db_user.id,
        match_id=pred.match_id,
        predicted_team_id=pred.predicted_team_id,
        is_draw=pred.is_draw,
        predicted_home_score=pred.predicted_home_score,
        predicted_away_score=pred.predicted_away_score
    )

    db.add(prediction)
    db.commit()

    return {
        "message": "Prediction saved"
    }

@app.get("/matches/{match_id}/votes")
def get_votes(
    match_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    db_user = (
        db.query(User)
        .filter(User.id == user["user_id"])
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    match = (
        db.query(Match)
        .filter(Match.id == match_id)
        .first()
    )

    if not match:
        raise HTTPException(
            status_code=404,
            detail="Match not found"
        )

    predictions = (
        db.query(Prediction)
        .filter(Prediction.match_id == match_id)
        .all()
    )

    team1_votes = []
    team2_votes = []
    draw_votes = []

    for p in predictions:

        user_obj = (
            db.query(User)
            .filter(User.id == p.user_id)
            .first()
        )

        if not user_obj:
            continue

        score_prediction = None

        if (
            p.predicted_home_score is not None
            and p.predicted_away_score is not None
        ):
            score_prediction = (
                f"{p.predicted_home_score}-"
                f"{p.predicted_away_score}"
            )

        vote_data = {
            "name": user_obj.name,
            "score": score_prediction
        }

        # -------------------------
        # DRAW
        # -------------------------
        if p.is_draw:
            draw_votes.append(vote_data)

        # -------------------------
        # TEAM 1
        # -------------------------
        elif p.predicted_team_id == match.team1_id:
            team1_votes.append(vote_data)

        # -------------------------
        # TEAM 2
        # -------------------------
        elif p.predicted_team_id == match.team2_id:
            team2_votes.append(vote_data)

    return {
        "team1": team1_votes,
        "draw": draw_votes,
        "team2": team2_votes
    }

# -------------------------
# RESULT UPDATE
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

    is_fifa = match.tournament == "FIFA WC 2026"

    # ---------------------------------------------------
    # NO RESULT
    # ---------------------------------------------------
    if result.winner_team_id is None and not getattr(result, "is_draw", False):

        match.status = "completed"
        match.winner_team_id = None

        db.commit()

        return {
            "message": "No Result marked"
        }

    match.status = "completed"

    # Save actual score
    match.team1_score = result.team1_score
    match.team2_score = result.team2_score

    # ---------------------------------------------------
    # GET USERS + PREDICTIONS
    # ---------------------------------------------------
    users = db.query(User).all()

    predictions = db.query(Prediction).filter(
        Prediction.match_id == match_id
    ).all()

    pred_map = {p.user_id: p for p in predictions}

    # ---------------------------------------------------
    # SCORING RULES
    # ---------------------------------------------------
    if match.sport == "football":

        knockout_stages = [
            "Quarter Final",
            "Quarter Finals",
            "Semi Final",
            "Semi Finals",
            "Final"
        ]

        if match.stage in knockout_stages:
            correct_points = 15
            wrong_points = -5
        else:
            correct_points = 10
            wrong_points = -5

    else:
        # IPL
        correct_points = 15
        wrong_points = -5

    # ---------------------------------------------------
    # DRAW CASE
    # ---------------------------------------------------
    if getattr(result, "is_draw", False):

        match.winner_team_id = None

        for u in users:

            p = pred_map.get(u.id)

            if p:

                if p.is_draw:
                    pts = correct_points
                else:
                    pts = wrong_points

                # Exact score bonus
                if (
                    p.predicted_home_score is not None
                    and p.predicted_away_score is not None
                    and result.team1_score is not None
                    and result.team2_score is not None
                ):
                    if (
                        p.predicted_home_score == result.team1_score
                        and p.predicted_away_score == result.team2_score
                    ):
                        pts += 5

                p.points_awarded = pts

            else:
                pts = wrong_points

            if is_fifa:
                u.fifa_points += pts
            else:
                u.points += pts

        db.commit()

        return {
            "message": "Draw processed",
            "correct_points": correct_points,
            "wrong_points": wrong_points
        }

    # ---------------------------------------------------
    # NORMAL WINNER
    # ---------------------------------------------------
    match.winner_team_id = result.winner_team_id

    for u in users:

        p = pred_map.get(u.id)

        if p:

            if p.is_draw:
                pts = wrong_points

            elif p.predicted_team_id == result.winner_team_id:
                pts = correct_points

            else:
                pts = wrong_points

            # Exact score bonus
            if (
                p.predicted_home_score is not None
                and p.predicted_away_score is not None
                and result.team1_score is not None
                and result.team2_score is not None
            ):
                if (
                    p.predicted_home_score == result.team1_score
                    and p.predicted_away_score == result.team2_score
                ):
                    pts += 5

            p.points_awarded = pts

        else:
            pts = wrong_points

        if is_fifa:
            u.fifa_points += pts
        else:
            u.points += pts

    db.commit()

    return {
        "message": "Result updated",
        "correct_points": correct_points,
        "wrong_points": wrong_points
    }

@app.post("/admin/reset-password/{user_id}")
def reset_password(
    user_id: int,
    new_password: str,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = pwd_context.hash(new_password)

    db.commit()

    return {"message": "Password updated successfully"}

@app.get("/leaderboard/fifa")
def fifa_leaderboard(db: Session = Depends(get_db)):

    users = (
        db.query(User)
        .order_by(User.fifa_points.desc())
        .all()
    )

    return [
        {
            "id": u.id,
            "name": u.name,
            "points": u.fifa_points
        }
        for u in users
    ]

@app.get("/leaderboard/ipl")
def ipl_leaderboard(db: Session = Depends(get_db)):

    users = (
        db.query(User)
        .order_by(User.points.desc())
        .all()
    )

    return [
        {
            "name": u.name,
            "points": u.points
        }
        for u in users
    ]

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
# DAILY WINNERS
# -------------------------
from datetime import datetime, timedelta

@app.get("/leaderboard/daily")
def daily_winners(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # --------------------------------------------------
    # Logged in user
    # --------------------------------------------------
    db_user = (
        db.query(User)
        .filter(User.id == user["user_id"])
        .first()
    )

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if not db_user.group_id:
        raise HTTPException(
            status_code=401,
            detail="Missing group"
        )

    group_id = db_user.group_id

    # --------------------------------------------------
    # Users in same group
    # --------------------------------------------------
    users = (
        db.query(User)
        .filter(User.group_id == group_id)
        .all()
    )

    user_ids = [u.id for u in users]

    # --------------------------------------------------
    # Latest completed match
    # --------------------------------------------------
    latest_match = (
        db.query(Match)
        .filter(Match.status == "completed")
        .order_by(Match.match_date.desc())
        .first()
    )

    if not latest_match:
        return []

    match_day = latest_match.match_date.date()

    # --------------------------------------------------
    # All completed matches from same day
    # --------------------------------------------------
    matches = (
        db.query(Match)
        .filter(Match.status == "completed")
        .all()
    )

    daily_matches = [
        m
        for m in matches
        if m.match_date.date() == match_day
    ]

    if not daily_matches:
        return []

    response = []

    # --------------------------------------------------
    # Process each completed match
    # --------------------------------------------------
    for match in daily_matches:

        predictions = (
            db.query(Prediction)
            .filter(
                Prediction.match_id == match.id,
                Prediction.user_id.in_(user_ids)
            )
            .all()
        )

        winners = []
        exact_score_winners = []

        for p in predictions:

            user_obj = (
                db.query(User)
                .filter(User.id == p.user_id)
                .first()
            )

            if not user_obj:
                continue

            # ------------------------------------------
            # Winner prediction correct
            # ------------------------------------------
            if (p.points_awarded or 0) > 0:
                winners.append(user_obj.name)

            # ------------------------------------------
            # Exact score bonus
            # ------------------------------------------
            if (
                p.predicted_home_score is not None
                and p.predicted_away_score is not None
                and match.team1_score is not None
                and match.team2_score is not None
                and p.predicted_home_score == match.team1_score
                and p.predicted_away_score == match.team2_score
            ):
                exact_score_winners.append(
                    user_obj.name
                )

        team1 = (
            db.query(Team)
            .filter(Team.id == match.team1_id)
            .first()
        )

        team2 = (
            db.query(Team)
            .filter(Team.id == match.team2_id)
            .first()
        )

        response.append({
            "match_id": match.id,

            "match_name": (
                f"{team1.short_name} vs "
                f"{team2.short_name}"
            ),

            "team1": team1.short_name,
            "team2": team2.short_name,

            "team1_score": match.team1_score,
            "team2_score": match.team2_score,

            "winners": winners,

            "exact_score_winners":
                exact_score_winners
        })

    return response  

@app.get("/fifa/standings")
def fifa_standings(db: Session = Depends(get_db)):

    matches = db.query(Match).filter(
        Match.tournament == "FIFA WC 2026",
        Match.status == "completed"
    ).all()

    standings = {}

    def init_team(group, team_id):
        if group not in standings:
            standings[group] = {}
        if team_id not in standings[group]:
            standings[group][team_id] = {
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points": 0
            }

    for match in matches:

        group = getattr(match, "group_name", "Group A")

        t1 = match.team1_id
        t2 = match.team2_id
        winner = match.winner_team_id

        init_team(group, t1)
        init_team(group, t2)

        standings[group][t1]["played"] += 1
        standings[group][t2]["played"] += 1

        # DRAW CASE
        if winner is None:
            standings[group][t1]["draws"] += 1
            standings[group][t2]["draws"] += 1

            standings[group][t1]["points"] += 1
            standings[group][t2]["points"] += 1

        else:
            # winner
            loser = t2 if winner == t1 else t1

            standings[group][winner]["wins"] += 1
            standings[group][winner]["points"] += 3

            standings[group][loser]["losses"] += 1

    # format response
    result = {}

    for group, teams in standings.items():
        group_list = []

        for team_id, stats in teams.items():
            team = db.query(Team).filter(Team.id == team_id).first()

            group_list.append({
                "team_id": team_id,
                "team": team.short_name if team else str(team_id),
                **stats
            })

        group_list.sort(key=lambda x: x["points"], reverse=True)

        result[group] = group_list

    return result

@app.post("/fifa/predict-winner")
def predict_winner(
    data: schemas.TournamentPredictionCreate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    if datetime.now(timezone.utc) >= FIFA_PREDICTION_LOCK_DATE:
        raise HTTPException(
            status_code=400,
            detail="Tournament predictions are locked"
        )

    existing = db.query(TournamentPrediction).filter(
        TournamentPrediction.user_id == user["user_id"],
        TournamentPrediction.tournament == "FIFA WC 2026"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Already predicted"
        )
    
    

    # Prevent duplicate selections

    teams = {
        data.champion_team_id,
        data.runner_up_team_id,
        data.third_place_team_id
    }

    if len(teams) != 3:
        raise HTTPException(
            status_code=400,
            detail="Champion, runner-up and third place must be different teams"
        )

    pred = TournamentPrediction(
        user_id=user["user_id"],
        tournament="FIFA WC 2026",

        champion_team_id=data.champion_team_id,
        runner_up_team_id=data.runner_up_team_id,
        third_place_team_id=data.third_place_team_id
    )

    db.add(pred)
    db.commit()

    return {
        "message": "Tournament prediction saved"
    }

@app.post("/admin/fifa/resolve-tournament")
def resolve_tournament(
    result: schemas.TournamentResult,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    predictions = (
        db.query(TournamentPrediction)
        .filter(
            TournamentPrediction.tournament == "FIFA WC 2026"
        )
        .all()
    )

    for p in predictions:

        points = 0

        # Champion (30 pts)
        if p.champion_team_id == result.champion_team_id:
            p.champion_correct = True
            points += 30
        else:
            p.champion_correct = False

        # Runner Up (20 pts)
        if p.runner_up_team_id == result.runner_up_team_id:
            p.runner_up_correct = True
            points += 20
        else:
            p.runner_up_correct = False

        # Third Place (10 pts)
        if p.third_place_team_id == result.third_place_team_id:
            p.third_place_correct = True
            points += 10
        else:
            p.third_place_correct = False

        db_user = (
            db.query(User)
            .filter(User.id == p.user_id)
            .first()
        )

        if db_user:

            # Remove previously awarded tournament points
            db_user.fifa_points -= p.points_awarded

            # Save new tournament points
            p.points_awarded = points

            # Add new tournament points
            db_user.fifa_points += points

    db.commit()

    return {
        "message": "Tournament predictions resolved successfully",
        "users_processed": len(predictions)
    }

@app.get("/fifa/my-prediction")
def my_prediction(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    prediction = db.query(
        TournamentPrediction
    ).filter(
        TournamentPrediction.user_id == user["user_id"],
        TournamentPrediction.tournament == "FIFA WC 2026"
    ).first()

    if not prediction:
        return None

    return prediction

@app.get("/teams")
def get_teams(tournament: str = None, db: Session = Depends(get_db)):

    query = db.query(Team)

    # If tournament is passed, filter teams
    if tournament:
        query = query.filter(Team.tournament == tournament)

    teams = query.all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "short_name": t.short_name,
            "tournament": t.tournament
        }
        for t in teams
    ]


@app.get("/matches/upcoming/{tournament}")
def get_matches_by_tournament(
    tournament: str,
    db: Session = Depends(get_db)
):
    next_match = (
        db.query(Match)
        .filter(
            Match.status == "scheduled",
            Match.tournament == tournament
        )
        .order_by(Match.match_date.asc())
        .first()
    )

    if not next_match:
        return []

    next_date = next_match.match_date.date()

    matches = (
        db.query(Match)
        .filter(
            Match.status == "scheduled",
            Match.tournament == tournament
        )
        .order_by(Match.match_date.asc())
        .limit(3)
        .all()
    )

    #matches = [
     #   m for m in matches
      #  if m.match_date.date() == next_date
    #]

    IST = timezone(timedelta(hours=5, minutes=30))

    result = []

    for m in matches:

        team1 = db.query(Team).filter(Team.id == m.team1_id).first()
        team2 = db.query(Team).filter(Team.id == m.team2_id).first()

        # Convert stored IST datetime → UTC
        match_datetime_utc = (
            m.match_date
            .replace(tzinfo=IST)
            .astimezone(timezone.utc)
        )

        result.append({
            "match_id": m.id,

            "team1": {
                "id": team1.id,
                "name": team1.name,
                "short": team1.short_name
            },

            "team2": {
                "id": team2.id,
                "name": team2.name,
                "short": team2.short_name
            },

            "match_date": m.match_date.strftime("%Y-%m-%d"),

            # UTC timestamp sent to frontend
            "match_datetime": match_datetime_utc.isoformat(),

            "venue": m.venue,

            "ai_prediction_team_id": None,
            "ai_probability": 0.50,

            "sport": m.sport,
            "tournament": m.tournament,
            "stage": m.stage
        })

    return result

@app.get("/fifa/qualified-teams")
def get_qualified_teams(db: Session = Depends(get_db)):

    matches = (
        db.query(Match)
        .filter(
            Match.tournament == "FIFA WC 2026",
            Match.stage == "Round of 16",
        )
        .all()
    )

    team_ids = set()

    for m in matches:
        team_ids.add(m.team1_id)
        team_ids.add(m.team2_id)

    teams = (
        db.query(Team)
        .filter(Team.id.in_(team_ids))
        .order_by(Team.name)
        .all()
    )

    return teams

@app.get("/fifa/my-prediction")
def get_my_prediction(
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    prediction = (
        db.query(TournamentPrediction)
        .filter(
            TournamentPrediction.user_id == user["user_id"],
            TournamentPrediction.tournament == "FIFA WC 2026"
        )
        .first()
    )

    if not prediction:
        return None

    return {
        "champion_team_id": prediction.champion_team_id,
        "runner_up_team_id": prediction.runner_up_team_id,
        "third_place_team_id": prediction.third_place_team_id,
        "points_awarded": prediction.points_awarded
    }