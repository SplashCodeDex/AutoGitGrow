from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, index=True)
    timestamp = Column(DateTime)
    source_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    repository_name = Column(String, nullable=True)

    source_user = relationship("User", foreign_keys=[source_user_id], back_populates="initiated_events")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="targeted_events")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    initiated_events = relationship("Event", foreign_keys=[Event.source_user_id], back_populates="source_user")
    targeted_events = relationship("Event", foreign_keys=[Event.target_user_id], back_populates="target_user")

class FollowerHistory(Base):
    __tablename__ = "follower_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)
    count = Column(Integer)
