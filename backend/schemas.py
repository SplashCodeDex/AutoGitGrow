from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

class UserBase(CamelModel):
    username: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

class UserProfile(CamelModel):
    username: str
    avatar_url: Optional[str] = None
    html_url: Optional[str] = None
    name: Optional[str] = None
    bio: Optional[str] = None

class DetailedUser(CamelModel):
    username: str
    avatar_url: Optional[str] = None
    followers: Optional[int] = None
    url: Optional[str] = None

class EventBase(CamelModel):
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

class FollowerHistoryBase(CamelModel):
    timestamp: datetime
    count: int

class FollowerHistoryCreate(FollowerHistoryBase):
    pass

class FollowerHistory(FollowerHistoryBase):
    id: int

class ReciprocityData(CamelModel):
    followed_back: List[str]
    not_followed_back: List[str]

class WhitelistUpdate(CamelModel):
    content: str

class WhitelistItemBase(CamelModel):
    username: str

class WhitelistItemCreate(WhitelistItemBase):
    reciprocity_rate: float

class WhitelistItem(WhitelistItemBase):
    id: int

class UserStats(CamelModel):
    followers_gained: int
    follow_backs: int
    unfollowed: int
    stargazers: int
    reciprocity_rate: float

class DashboardStats(CamelModel):
    followers: int
    following: int
    starred_repos: int
    mutual_followers: int

class GeminiInsightRequest(CamelModel):
    stats: UserStats
    growth_data: List[FollowerHistory]

class UserAnalysisRequest(BaseModel):
    username: str
    bio: Optional[str] = None
    readme_content: Optional[str] = None
    recent_activity: Optional[str] = None

class UserAnalysisResponse(BaseModel):
    username: str
    is_relevant: bool
    reason: str
    confidence_score: float
