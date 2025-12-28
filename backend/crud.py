from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
import backend.models as models
import backend.schemas as schemas
import os
from datetime import datetime, timezone
from typing import Optional, Any
from sqlalchemy import func
from github import Github
from backend.utils import logger

def get_detailed_users(db: Session, usernames: list[str]) -> list[dict[str, Any]]:
    logger.info(f"Fetching detailed users for: {usernames}")
    g = Github(os.getenv("GITHUB_PAT"))
    detailed_users = []
    for username in usernames:
        try:
            user = g.get_user(username)
            detailed_users.append({
                "username": user.login,
                "avatar_url": user.avatar_url,
                "followers": user.followers,
                "url": user.html_url
            })
        except Exception as e:
            logger.error(f"Error fetching user {username} from GitHub: {e}")
            raise HTTPException(status_code=500, detail=f"Error fetching user {username} from GitHub: {e}")
    return detailed_users

def get_detailed_repositories(db: Session, repo_names: list[str]) -> list[dict[str, Any]]:
    logger.info(f"Fetching detailed repositories for: {repo_names}")
    g = Github(os.getenv("GITHUB_PAT"))
    detailed_repos = []
    for repo_name in repo_names:
        try:
            repo = g.get_repo(repo_name)
            detailed_repos.append({
                "name": repo.full_name,
                "description": repo.description,
                "stargazers_count": repo.stargazers_count,
                "url": repo.html_url
            })
        except Exception as e:
            logger.error(f"Error fetching repository {repo_name} from GitHub: {e}")
            raise HTTPException(status_code=500, detail=f"Error fetching repository {repo_name} from GitHub: {e}")
    return detailed_repos

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    logger.info(f"Attempting to retrieve user by username: {username}")
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    logger.info(f"Creating new user: {user.username}")
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User created with ID: {db_user.id}")
    return db_user

def create_user_if_not_exists(db: Session, username: str) -> models.User:
    user = get_user_by_username(db, username)
    if not user:
        user = create_user(db, schemas.UserCreate(username=username))
    return user

def get_bot_user_id(db: Session) -> Optional[int]:
    bot_username = os.getenv("BOT_USER")
    if not bot_username:
        logger.warning("BOT_USER environment variable not set.")
        return None

    bot_user = get_user_by_username(db, username=bot_username)
    if not bot_user:
        logger.info(f"Bot user '{bot_username}' not found, creating it.")
        bot_user = create_user(db, user=schemas.UserCreate(username=bot_username))
    logger.info(f"Bot user ID: {bot_user.id}")
    return bot_user.id

def create_event(db: Session, event: schemas.EventCreate, source_user_id: Optional[int] = None, target_user_id: Optional[int] = None, repository_name: Optional[str] = None) -> models.Event:
    logger.info(f"Creating event of type '{event.event_type}' for source_user_id: {source_user_id}, target_user_id: {target_user_id}, repository_name: {repository_name}")
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    logger.info(f"Event created with ID: {db_event.id}")
    return db_event

def get_events(db: Session, skip: int = 0, limit: int = 100) -> list[models.Event]:
    logger.info(f"Fetching events with skip={skip}, limit={limit}.")
    return db.query(models.Event).options(joinedload(models.Event.source_user), joinedload(models.Event.target_user)).offset(skip).limit(limit).all()

def create_follower_history(db: Session, count: int) -> models.FollowerHistory:
    logger.info(f"Creating follower history with count: {count}.")
    db_follower_history = models.FollowerHistory(timestamp=datetime.now(timezone.utc), count=count)
    db.add(db_follower_history)
    db.commit()
    db.refresh(db_follower_history)
    logger.info(f"Follower history created with ID: {db_follower_history.id}.")
    return db_follower_history

def get_follower_history(db: Session, skip: int = 0, limit: int = 100) -> list[models.FollowerHistory]:
    logger.info(f"Fetching follower history with skip={skip}, limit={limit}.")
    return db.query(models.FollowerHistory).offset(skip).limit(limit).all()

def get_bot_user_details(db: Session) -> Optional[dict[str, Any]]:
    logger.info("Fetching bot user details.")
    bot_username = os.getenv("BOT_USER")
    if not bot_username:
        logger.warning("BOT_USER environment variable not set.")
        return None

    g = Github(os.getenv("GITHUB_PAT"))
    try:
        user = g.get_user(bot_username)
        return {
            "username": user.login,
            "avatar_url": user.avatar_url,
            "html_url": user.html_url,
            "name": user.name,
            "bio": user.bio
        }
    except Exception as e:
        logger.error(f"Error fetching bot user details from GitHub: {e}")
        # Fallback to basic info if GitHub API fails
        return {"username": bot_username, "avatar_url": None, "html_url": f"https://github.com/{bot_username}", "name": bot_username, "bio": "GitHub Bot"}

def get_whitelist(db: Session) -> list[models.Whitelist]:
    logger.info("Fetching whitelist.")
    return db.query(models.Whitelist).all()

def add_whitelist_user(db: Session, username: str) -> models.Whitelist:
    logger.info(f"Adding user to whitelist: {username}")
    db_item = models.Whitelist(username=username)
    try:
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add user to whitelist: {e}")
        raise HTTPException(status_code=400, detail="User already in whitelist or other error.")

def remove_whitelist_user(db: Session, username: str) -> dict[str, str]:
    logger.info(f"Removing user from whitelist: {username}")
    db_item = db.query(models.Whitelist).filter(models.Whitelist.username == username).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return {"message": "User removed from whitelist"}
    raise HTTPException(status_code=404, detail="User not found in whitelist")

def get_active_follows(db: Session) -> dict[str, str]:
    logger.info("Calculating active follows from events.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        return {}

    # Fetch all follow and unfollow events by the bot
    events = db.query(models.Event).filter(
        models.Event.source_user_id == bot_user_id,
        models.Event.event_type.in_(["follow", "unfollow"])
    ).order_by(models.Event.timestamp.asc()).all()

    active_follows = {}
    for event in events:
        if event.target_user:
            username = event.target_user.username.lower()
            if event.event_type == "follow":
                active_follows[username] = event.timestamp.isoformat()
            elif event.event_type == "unfollow":
                if username in active_follows:
                    del active_follows[username]

    logger.info(f"Found {len(active_follows)} active follows.")
    return active_follows

def get_growth_starred_users(db: Session) -> list[str]:
    logger.info("Fetching growth starred users from events.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        return []

    # Fetch all growth_star events
    # We only need the target usernames
    # Assuming target_user_id is populated for growth_star events
    # If not, we might need to check how send_event handles it.
    # scripts/autostargrow.py sends "growth_star" with "username" param.
    # backend/main.py create_event endpoint looks up user_id from username if provided.
    # So target_user_id should be set.

    starred_users = db.query(models.User.username).join(
        models.Event, models.User.id == models.Event.target_user_id
    ).filter(
        models.Event.event_type == "growth_star"
    ).distinct().all()

    # starred_users is a list of tuples [('username',), ...]
    result = [u[0] for u in starred_users]
    logger.info(f"Found {len(result)} growth starred users.")
    return result
