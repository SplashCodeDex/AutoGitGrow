from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
from backend.auth import get_current_user, User
from backend.utils import logger
from backend.services.github_service import get_real_reciprocity

router = APIRouter(tags=["stats"])

@router.get("/api/stats", response_model=schemas.DashboardStats)
def read_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read stats.")
    # For now, return zeroed stats if not implemented or mock
    # Ideally should fetch from User profile + DB checks
    return schemas.DashboardStats(
        followers=0,
        following=0,
        starred_repos=0,
        mutual_followers=0
    )

@router.get("/api/follower-growth", response_model=List[schemas.FollowerHistory])
def read_follower_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read follower history with skip={skip}, limit={limit}.")
    follower_history = crud.get_follower_history(db, skip=skip, limit=limit)
    return follower_history

@router.get("/api/reciprocity")
def read_reciprocity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read reciprocity data.")
    return get_real_reciprocity(db)

@router.post("/api/detailed-repositories")
def read_detailed_repositories(repo_names: List[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read detailed repositories for: {repo_names}.")
    return crud.get_detailed_repositories(db, repo_names)

@router.get("/api/follows/active")
def read_active_follows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read active follows.")
    return crud.get_active_follows(db)

@router.get("/api/stars/growth")
def read_growth_starred_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read growth starred users.")
    return crud.get_growth_starred_users(db)
