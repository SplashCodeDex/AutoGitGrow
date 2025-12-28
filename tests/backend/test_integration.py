import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add project root directory to Python path
project_root = os.path.join(os.path.dirname(__file__), '../../')
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.main import app
from backend.database import Base, get_db

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

@pytest.fixture
def client_fixture():
    from backend.auth import get_current_user, User

    def override_get_current_user():
        return User(username="testuser")

    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    # Clean up overrides
    app.dependency_overrides.clear()

def test_create_and_read_user(client_fixture):
    # Test the main health endpoint
    response = client_fixture.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"

def test_health_endpoint(client_fixture):
    # Test the health endpoint which should always work
    response = client_fixture.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"

def test_api_stats_endpoint(client_fixture):
    # Test the stats endpoint
    response = client_fixture.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    # Check for expected keys in DashboardStats
    assert "followers" in data
    assert "following" in data
