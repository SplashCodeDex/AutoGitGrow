from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
from backend.auth import get_current_user, User
from backend.utils import logger

router = APIRouter(tags=["users"])

@router.get("/users/{username}", response_model=schemas.User)
def read_user(username: str, db: Session = Depends(get_db)):
    logger.info(f"Received request to read user: {username}")
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        logger.warning(f"User not found: {username}")
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/api/user/me", response_model=schemas.UserProfile)
def read_current_user(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read current bot user details.")
    return crud.get_bot_user_details(db)

@router.post("/api/detailed-users", response_model=List[schemas.DetailedUser])
def read_detailed_users(usernames: List[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read detailed users for: {usernames}.")
    return crud.get_detailed_users(db, usernames)
