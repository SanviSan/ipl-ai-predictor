from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    group_id: int  

class UserLogin(BaseModel):
    email: str
    password: str

class PredictionCreate(BaseModel):
    match_id: int
    predicted_team_id: Optional[int] = None
    is_draw: bool = False
    predicted_home_score: int | None = None
    predicted_away_score: int | None = None

class MatchResultUpdate(BaseModel):
    winner_team_id: Optional[int] = None
    is_draw: bool = False

    team1_score: int | None = None
    team2_score: int | None = None

class TournamentPredictionCreate(BaseModel):
    tournament: str = "FIFA WC 2026"

    champion_team_id: int
    runner_up_team_id: int
    third_place_team_id: int

class TournamentPredictionResponse(BaseModel):
    tournament: str

    champion_team_id: int
    runner_up_team_id: int
    third_place_team_id: int

    points_awarded: int = 0
    
class TeamBase(BaseModel):
    name: str
    short_name: str
    tournament: str | None = None

class TournamentResult(BaseModel):
    champion_team_id: int
    runner_up_team_id: int
    third_place_team_id: int