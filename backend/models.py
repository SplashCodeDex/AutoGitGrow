from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime, default=func.now())
    source_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    repository_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    source_user = relationship("User", foreign_keys=[source_user_id], back_populates="initiated_events")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="targeted_events")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    initiated_events = relationship("Event", foreign_keys=[Event.source_user_id], back_populates="source_user")
    targeted_events = relationship("Event", foreign_keys=[Event.target_user_id], back_populates="target_user")

class FollowerHistory(Base):
    __tablename__ = "follower_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    count = Column(Integer)

class Whitelist(Base):
    __tablename__ = "whitelist"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())
