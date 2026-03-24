from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class PredictionCreate(BaseModel):
    match_id: int
    predicted_team_id: int

class MatchResultUpdate(BaseModel):
    winner_team_id: int