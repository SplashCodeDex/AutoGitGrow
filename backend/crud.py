from sqlalchemy.orm import Session, joinedload
from . import models, schemas
import os
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import func

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_bot_user_id(db: Session):
    bot_username = os.getenv("BOT_USER")
    if not bot_username:
        raise ValueError("BOT_USER environment variable not set.")
    
    bot_user = get_user_by_username(db, username=bot_username)
    if not bot_user:
        bot_user = create_user(db, user=schemas.UserCreate(username=bot_username))
    return bot_user.id

def create_event(db: Session, event: schemas.EventCreate, source_user_id: Optional[int] = None, target_user_id: Optional[int] = None, repository_name: Optional[str] = None):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_top_repositories(db: Session, limit: int = 5):
    top_repos = (
        db.query(
            models.Event.repository_name,
            func.count(models.Event.repository_name).label("stargazers_count")
        ).filter(
            models.Event.event_type == "star",
            models.Event.repository_name.isnot(None)
        ).group_by(models.Event.repository_name)
        .order_by(func.count(models.Event.repository_name).desc())
        .limit(limit)
        .all()
    )
    
    return [{"name": repo.repository_name, "stargazers_count": repo.stargazers_count} for repo in top_repos]

def get_suggested_users(db: Session, limit: int = 5):
    bot_user_id = get_bot_user_id(db)

    # Find users who starred the bot's repositories
    starred_by_users_ids = db.query(models.Event.source_user_id).filter(
        models.Event.event_type == "star",
        models.Event.target_user_id == bot_user_id,
        models.Event.source_user_id.isnot(None)
    ).distinct().all()

    suggested_users = []
    for user_id_tuple in starred_by_users_ids:
        starred_user_id = user_id_tuple[0]
        
        # Check if the bot has already followed this user
        bot_followed_user = db.query(models.Event).filter(
            models.Event.event_type == "follow",
            models.Event.source_user_id == bot_user_id,
            models.Event.target_user_id == starred_user_id
        ).first()

        if not bot_followed_user:
            # Get the username of the suggested user
            user = db.query(models.User).filter(models.User.id == starred_user_id).first()
            if user:
                suggested_users.append(user.username)
        
        if len(suggested_users) >= limit:
            break
            
    return suggested_users

def get_follow_backs(db: Session):
    bot_user_id = get_bot_user_id(db)

    # Get users the bot followed
    bot_followed_users_ids = db.query(models.Event.target_user_id).filter(
        models.Event.event_type == "follow",
        models.Event.source_user_id == bot_user_id
    ).distinct().all()

    follow_backs_count = 0
    for user_id_tuple in bot_followed_users_ids:
        followed_user_id = user_id_tuple[0]
        
        # Check if this user followed the bot back
        user_followed_bot_back = db.query(models.Event).filter(
            models.Event.event_type == "follow",
            models.Event.source_user_id == followed_user_id,
            models.Event.target_user_id == bot_user_id
        ).first()
        
        if user_followed_bot_back:
            follow_backs_count += 1
            
    return follow_backs_count

def get_stats(db: Session):
    followers = db.query(models.Event).filter(models.Event.event_type == "follow").count()
    unfollows = db.query(models.Event).filter(models.Event.event_type == "unfollow").count()
    stars = db.query(models.Event).filter(models.Event.event_type == "star").count()
    unstars = db.query(models.Event).filter(models.Event.event_type == "unstar").count()
    growth_stars = db.query(models.Event).filter(models.Event.event_type == "growth_star").count()
    
    follow_backs = get_follow_backs(db)
    total_follows = followers # Assuming 'followers' here means total follows made by the bot
    reciprocity_rate = (follow_backs / total_follows) * 100 if total_follows > 0 else 0
    top_repositories = get_top_repositories(db)
    suggested_users = get_suggested_users(db)

    return {"followers": followers, "unfollows": unfollows, "stars": stars, "unstars": unstars, "growth_stars": growth_stars, "follow_backs": follow_backs, "reciprocity_rate": reciprocity_rate, "top_repositories": top_repositories, "suggested_users": suggested_users}

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).options(joinedload(models.Event.source_user), joinedload(models.Event.target_user)).offset(skip).limit(limit).all()

def create_follower_history(db: Session, count: int):
    db_follower_history = models.FollowerHistory(timestamp=datetime.now(timezone.utc), count=count)
    db.add(db_follower_history)
    db.commit()
    db.refresh(db_follower_history)
    return db_follower_history

def get_follower_history(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.FollowerHistory).offset(skip).limit(limit).all()
