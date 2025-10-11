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

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    user_id: int
    user: User # Add this line to include the User object

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
