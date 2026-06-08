from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey,Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    points = Column(Integer, default=0)
    fifa_points = Column(Integer, default=0)
    is_admin = Column(Boolean, default=False) 
    group_id = Column(Integer, nullable=True)

class Team(Base):  
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    short_name = Column(String, unique=True, index=True)
    city = Column(String)
    tournament = Column(String, nullable=True)

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer,ForeignKey('teams.id'))
    team2_id = Column(Integer,ForeignKey('teams.id'))
    match_date= Column(Date)
    winner_team_id = Column(Integer,ForeignKey('teams.id'))
    status = Column(String,default="scheduled")  # e.g., "scheduled", "completed"
    venue = Column(String, nullable=True)
    group_name = Column(String, nullable=True)

    #New for fifa wc
    tournament = Column(String, default="IPL 2026")
    sport = Column(String, default="Cricket")
    stage = Column(String, nullable=True)  # e.g., "Group Stage", "Knockout", "Final"
    team1_score = Column(Integer, nullable=True)
    team2_score = Column(Integer, nullable=True)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    match_id = Column(Integer)

    predicted_team_id = Column(
        Integer,
        ForeignKey("teams.id"),
        nullable=True
    )

    is_draw = Column(Boolean, default=False)

    points_awarded = Column(Integer, default=0)
    predicted_home_score = Column(Integer, nullable=True)
    predicted_away_score = Column(Integer, nullable=True)

class TournamentPrediction(Base):
    __tablename__ = "tournament_predictions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tournament = Column(String)  # "FIFA WC 2026"
    predicted_winner_team_id = Column(Integer)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Integer, default=0)