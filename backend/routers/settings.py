from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
from backend.auth import get_current_user, User
from backend.utils import logger

router = APIRouter(tags=["settings"])

@router.get("/api/settings/whitelist", response_model=List[schemas.WhitelistItem])
def read_whitelist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_whitelist(db)

@router.post("/api/settings/whitelist")
def update_whitelist(data: schemas.WhitelistUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to update whitelist.")

    # Parse the content string into a set of usernames
    new_usernames = set(line.strip() for line in data.content.split('\n') if line.strip())

    # Get current DB whitelist
    current_items = crud.get_whitelist(db)
    current_usernames = {item.username for item in current_items}

    # Add new users
    for username in new_usernames - current_usernames:
        crud.add_whitelist_user(db, username)

    # Remove users not in the new list
    for username in current_usernames - new_usernames:
        crud.remove_whitelist_user(db, username)

    return {"message": "Whitelist updated successfully."}
