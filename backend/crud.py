from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from . import models, schemas
import os
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import func
from github import Github
from .utils import logger

def get_detailed_users(db: Session, usernames: list[str]):
    logger.info(f"Fetching detailed users for: {usernames}")
    g = Github(os.getenv("PAT_TOKEN"))
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

def get_detailed_repositories(db: Session, repo_names: list[str]):
    logger.info(f"Fetching detailed repositories for: {repo_names}")
    g = Github(os.getenv("PAT_TOKEN"))
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

def get_user_by_username(db: Session, username: str):
    logger.info(f"Attempting to retrieve user by username: {username}")
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    logger.info(f"Creating new user: {user.username}")
    db_user = models.User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"User created with ID: {db_user.id}")
    return db_user

def get_bot_user_id(db: Session):
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

def create_event(db: Session, event: schemas.EventCreate, source_user_id: Optional[int] = None, target_user_id: Optional[int] = None, repository_name: Optional[str] = None):
    logger.info(f"Creating event of type '{event.event_type}' for source_user_id: {source_user_id}, target_user_id: {target_user_id}, repository_name: {repository_name}")
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    logger.info(f"Event created with ID: {db_event.id}")
    return db_event

def get_top_repositories(db: Session, limit: int = 5):
    logger.info(f"Fetching top {limit} repositories.")
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
    logger.info(f"Found {len(top_repos)} top repositories.")
    return [{"name": repo.repository_name, "stargazers_count": repo.stargazers_count} for repo in top_repos]

def get_suggested_users(db: Session, limit: int = 5):
    logger.info(f"Fetching {limit} suggested users.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        logger.warning("Bot user ID not available, cannot fetch suggested users.")
        return []

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
    logger.info(f"Found {len(suggested_users)} suggested users.")
    return suggested_users

def get_follow_backs(db: Session):
    logger.info("Calculating follow backs.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        logger.warning("Bot user ID not available, cannot calculate follow backs.")
        return 0

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
    logger.info(f"Calculated {follow_backs_count} follow backs.")
    return follow_backs_count

def get_reciprocity_data(db: Session):
    logger.info("Fetching reciprocity data.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        logger.warning("Bot user ID not available, returning empty reciprocity data.")
        return schemas.ReciprocityData(followed_back=[], not_followed_back=[])

    bot_followed_users = db.query(models.User).join(models.Event, models.User.id == models.Event.target_user_id).filter(
        models.Event.event_type == "follow",
        models.Event.source_user_id == bot_user_id
    ).distinct().all()

    followed_back = []
    not_followed_back = []

    for user in bot_followed_users:
        user_followed_bot_back = db.query(models.Event).filter(
            models.Event.event_type == "follow",
            models.Event.source_user_id == user.id,
            models.Event.target_user_id == bot_user_id
        ).first()

        if user_followed_bot_back:
            followed_back.append(user.username)
        else:
            not_followed_back.append(user.username)
    logger.info(f"Reciprocity data: Followed back: {len(followed_back)}, Not followed back: {len(not_followed_back)}.")
    return schemas.ReciprocityData(followed_back=followed_back, not_followed_back=not_followed_back)

def get_stats(db: Session):
    logger.info("Fetching application statistics.")
    bot_user_id = get_bot_user_id(db)
    if not bot_user_id:
        logger.error("BOT_USER environment variable not set. Cannot fetch stats.")
        raise HTTPException(status_code=404, detail="BOT_USER environment variable not set. Please configure it in your .env file.")

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

    logger.info("Statistics fetched successfully.")
    return {"followers": followers, "unfollows": unfollows, "stars": stars, "unstars": unstars, "growth_stars": growth_stars, "follow_backs": follow_backs, "reciprocity_rate": reciprocity_rate, "top_repositories": top_repositories, "suggested_users": suggested_users}

def get_events(db: Session, skip: int = 0, limit: int = 100):
    logger.info(f"Fetching events with skip={skip}, limit={limit}.")
    return db.query(models.Event).options(joinedload(models.Event.source_user), joinedload(models.Event.target_user)).offset(skip).limit(limit).all()

def create_follower_history(db: Session, count: int):
    logger.info(f"Creating follower history with count: {count}.")
    db_follower_history = models.FollowerHistory(timestamp=datetime.now(timezone.utc), count=count)
    db.add(db_follower_history)
    db.commit()
    db.refresh(db_follower_history)
    logger.info(f"Follower history created with ID: {db_follower_history.id}.")
    return db_follower_history

def get_follower_history(db: Session, skip: int = 0, limit: int = 100):
    logger.info(f"Fetching follower history with skip={skip}, limit={limit}.")
    return db.query(models.FollowerHistory).offset(skip).limit(limit).all()
