from typing import List
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from .utils import logger
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the project root
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

from fastapi.responses import JSONResponse

app = FastAPI()

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception(f"An unexpected error occurred: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred. Please try again later."},
    )

# Dependency
def get_db():
    db = SessionLocal()
    try:
        logger.info("Database session opened.")
        yield db
    finally:
        db.close()
        logger.info("Database session closed.")


@app.post("/events/", response_model=schemas.Event)
def create_event_for_user(event: schemas.EventCreate, db: Session = Depends(get_db)):
    logger.info(f"Received request to create event for user: {event.source_user_id} and {event.target_user_id}")
    return crud.create_event(db=db, event=event, source_user_id=event.source_user_id, target_user_id=event.target_user_id, repository_name=event.repository_name)


@app.get("/users/{username}", response_model=schemas.User)
def read_user(username: str, db: Session = Depends(get_db)):
    logger.info(f"Received request to read user: {username}")
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        logger.warning(f"User not found: {username}")
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/api/stats")
def read_stats(db: Session = Depends(get_db)):
    logger.info("Received request to read stats.")
    return crud.get_stats(db)

@app.get("/api/activity-feed", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Received request to read activity feed with skip={skip}, limit={limit}.")
    events = crud.get_events(db, skip=skip, limit=limit)
    return events

@app.post("/api/follower-history/", response_model=schemas.FollowerHistory)
def create_follower_history(count: int, db: Session = Depends(get_db)):
    logger.info(f"Received request to create follower history with count: {count}.")
    return crud.create_follower_history(db=db, count=count)

@app.get("/api/follower-growth", response_model=List[schemas.FollowerHistory])
def read_follower_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Received request to read follower history with skip={skip}, limit={limit}.")
    follower_history = crud.get_follower_history(db, skip=skip, limit=limit)
    return follower_history

@app.get("/api/reciprocity", response_model=schemas.ReciprocityData)
def read_reciprocity(db: Session = Depends(get_db)):
    logger.info("Received request to read reciprocity data.")
    return crud.get_reciprocity_data(db)

@app.post("/api/detailed-users")
def read_detailed_users(usernames: List[str], db: Session = Depends(get_db)):
    logger.info(f"Received request to read detailed users for: {usernames}.")
    return crud.get_detailed_users(db, usernames)

@app.post("/api/detailed-repositories")
def read_detailed_repositories(repo_names: List[str], db: Session = Depends(get_db)):
    logger.info(f"Received request to read detailed repositories for: {repo_names}.")
    return crud.get_detailed_repositories(db, repo_names)
