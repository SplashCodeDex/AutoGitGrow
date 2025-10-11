from typing import List
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/events/", response_model=schemas.Event)
def create_event_for_user(username: str, event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        db_user = crud.create_user(db, user=schemas.UserCreate(username=username))
    return crud.create_event(db=db, event=event, user_id=db_user.id)


@app.get("/users/{username}", response_model=schemas.User)
def read_user(username: str, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/api/stats")
def read_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)

@app.get("/api/activity-feed", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = crud.get_events(db, skip=skip, limit=limit)
    return events

@app.post("/api/follower-history/", response_model=schemas.FollowerHistory)
def create_follower_history(count: int, db: Session = Depends(get_db)):
    return crud.create_follower_history(db=db, count=count)

@app.get("/api/follower-growth", response_model=List[schemas.FollowerHistory])
def read_follower_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    follower_history = crud.get_follower_history(db, skip=skip, limit=limit)
    return follower_history
