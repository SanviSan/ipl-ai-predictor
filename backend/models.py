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
    is_admin = Column(Boolean, default=False) 

class Team(Base):  
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    short_name = Column(String, unique=True, index=True)
    city = Column(String)

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    team1_id = Column(Integer,ForeignKey('teams.id'))
    team2_id = Column(Integer,ForeignKey('teams.id'))
    match_date= Column(Date)
    winner_team_id = Column(Integer,ForeignKey('teams.id'))
    status = Column(String,default="scheduled")  # e.g., "scheduled", "completed"
    venue = Column(String, nullable=True)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    match_id = Column(Integer)
    predicted_team_id = Column(Integer, ForeignKey('teams.id')) 

    points_awarded = Column(Integer, default=0)