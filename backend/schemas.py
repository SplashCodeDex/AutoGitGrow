from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

User.model_rebuild()

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

    model_config = ConfigDict(from_attributes=True)

class FollowerHistoryBase(BaseModel):
    timestamp: datetime
    count: int

class FollowerHistoryCreate(FollowerHistoryBase):
    pass

class FollowerHistory(FollowerHistoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ReciprocityData(BaseModel):
    followed_back: List[str]
    not_followed_back: List[str]
