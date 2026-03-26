from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User
from backend.schemas import UserCreate, UserLogin
from jose import jwt
from passlib.context import CryptContext

router = APIRouter()

SECRET = "SUPER_SECRET"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if not existing_user or not pwd_context.verify(user.password, existing_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    is_admin_flag = bool(existing_user.is_admin)

    token = jwt.encode(
        {"user_id": existing_user.id},
        SECRET,
        algorithm="HS256"
    )

    return {
        "token": token,
        "is_admin": is_admin_flag
    }