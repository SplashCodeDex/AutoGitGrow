from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
from backend.auth import get_current_user, User
from backend.utils import logger

router = APIRouter(tags=["events"])

@router.post("/events/", response_model=schemas.Event)
@router.post("/api/events/", response_model=schemas.Event)
def create_event_for_user(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to create event for user: {event.source_user_id} and {event.target_user_id}")
    return crud.create_event(db=db, event=event, source_user_id=event.source_user_id, target_user_id=event.target_user_id, repository_name=event.repository_name)
