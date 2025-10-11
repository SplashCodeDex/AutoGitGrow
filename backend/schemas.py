from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

User.update_forward_refs()

class EventBase(BaseModel):
    event_type: str
    timestamp: datetime
    source_user_id: Optional[int] = None
    target_user_id: Optional[int] = None
    repository_name: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    source_user: Optional[User] = None
    target_user: Optional[User] = None

    class Config:
        orm_mode = True

class FollowerHistoryBase(BaseModel):
    timestamp: datetime
    count: int

class FollowerHistoryCreate(FollowerHistoryBase):
    pass

class FollowerHistory(FollowerHistoryBase):
    id: int

    class Config:
        orm_mode = True
