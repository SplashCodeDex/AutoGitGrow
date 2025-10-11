from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_event(db: Session, event: schemas.EventCreate, user_id: int):
    db_event = models.Event(**event.dict(), user_id=user_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_stats(db: Session):
    followers = db.query(models.Event).filter(models.Event.event_type == "follow").count()
    unfollows = db.query(models.Event).filter(models.Event.event_type == "unfollow").count()
    stars = db.query(models.Event).filter(models.Event.event_type == "star").count()
    unstars = db.query(models.Event).filter(models.Event.event_type == "unstar").count()
    growth_stars = db.query(models.Event).filter(models.Event.event_type == "growth_star").count()
    return {"followers": followers, "unfollows": unfollows, "stars": stars, "unstars": unstars, "growth_stars": growth_stars}

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).offset(skip).limit(limit).all()

def create_follower_history(db: Session, count: int):
    db_follower_history = models.FollowerHistory(timestamp=datetime.now(timezone.utc), count=count)
    db.add(db_follower_history)
    db.commit()
    db.refresh(db_follower_history)
    return db_follower_history

def get_follower_history(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FollowerHistory).offset(skip).limit(limit).all()
