import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL",
                         "postgresql://ipl_predictor_db_user:E3ulBuo3LESxakNg6xrXwgvgHis5CTmA@dpg-d6oh3fua2pns738e06ig-a.oregon-postgres.render.com/ipl_predictor_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for FastAPI to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()