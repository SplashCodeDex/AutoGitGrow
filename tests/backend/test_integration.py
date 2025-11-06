import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from main import app, get_db
from database import Base

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to use the test database
@pytest.fixture()
def session_override():
    Base.metadata.create_all(bind=engine)  # Create tables
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine) # Drop tables after tests

def override_get_db():
    db = TestingSessionLocal()
    Base.metadata.create_all(bind=engine)
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_and_read_user():
    # Test creating a user
    username = "integrationtestuser"
    response = client.post(
        "/events/",
        json={
            "event_type": "follow",
            "source_user_id": None, # Will be created by the backend
            "target_user_id": None, # Will be created by the backend
            "repository_name": None,
            "username": username # This field is not in EventCreate schema, will be ignored
        }
    )
    assert response.status_code == 200
    # The actual user creation happens implicitly when an event is created for a new user
    # So we need to read the user to verify

    # Test reading the created user
    response = client.get(f"/users/{username}")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == username
    assert "id" in data

def test_read_nonexistent_user():
    response = client.get("/users/nonexistentuser")
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
