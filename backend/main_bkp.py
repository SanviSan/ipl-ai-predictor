# backend/main.py
from fastapi import FastAPI, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.auth import router as auth_router
from backend.schemas import PredictionCreate
from backend.models import Prediction, User
from backend.predict_match import predict  # your AI model function
from jose import jwt
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# auto create tables based on models
Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth")

SECRET = "SUPER_SECRET"

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/matches/today")
def get_today_matches():
    # Placeholder: replace with actual logic to fetch today's matches
    return [
        {"match_id": "IPL001", "team1": "CSK", "team2": "MI"},
        {"match_id": "IPL002", "team1": "RCB", "team2": "KKR"}
    ]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/predict")
def predict_endpoint(
    prediction: PredictionCreate, 
    authorization: str = Header(...), 
    db: Session = Depends(get_db)
):
    logging.info("Received prediction payload: %s", prediction.dict())

    # Decode JWT token
    try:
        token = authorization.split(" ")[1]  # Expect "Bearer <token>"
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        logging.info("User ID from token: %s", user_id)
    except Exception as e:
        logging.error("Token decode error: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or missing token")

    # AI Prediction
    try:
        ai_winner, ai_prob = predict(
            team1=prediction.team1,
            team2=prediction.team2,
            venue=prediction.venue,
            city=prediction.city,
            toss_winner=prediction.toss_winner,
            toss_decision=prediction.toss_decision,
            season=prediction.season,
            target_runs=prediction.target_runs,
            team1_player_count=prediction.team1_player_count,
            team2_player_count=prediction.team2_player_count
        )
        logging.info("AI Prediction: winner=%s, probability=%s", ai_winner, ai_prob)
    except Exception as e:
        logging.error("AI prediction error: %s", e)
        raise HTTPException(status_code=500, detail="Prediction failed")

    # Points calculation
    points_awarded = 0
    if prediction.predicted_winner:
        points_awarded = 10 if prediction.predicted_winner == ai_winner else -5
    logging.info("User prediction: %s, Points awarded: %s", prediction.predicted_winner, points_awarded)

    # Save prediction
    try:
        new_prediction = Prediction(
            user_id=user_id,
            match_id=prediction.match_id,
            predicted_winner=prediction.predicted_winner or ai_winner,
            points_awarded=points_awarded
        )
        db.add(new_prediction)

        # Update user points
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.points += points_awarded
            db.add(user)

        db.commit()
        db.refresh(new_prediction)
        logging.info("Prediction saved in DB with ID: %s", new_prediction.id)
    except Exception as e:
        logging.error("DB error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to save prediction")

    # Return response
    response = {
        "ai_winner": ai_winner,
        "ai_probability": ai_prob,
        "user_prediction": prediction.predicted_winner,
        "points_awarded": points_awarded
    }
    logging.info("Response sent to frontend: %s", response)
    return response


@app.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.points.desc()).all()
    return [{"name": user.name, "points": user.points} for user in users]