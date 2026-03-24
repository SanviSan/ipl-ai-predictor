from sqlalchemy import Column, Integer, String, DateTime
from Database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    points = Column(Integer, default=0)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    match_id = Column(Integer)
    predicted_winner = Column(String)