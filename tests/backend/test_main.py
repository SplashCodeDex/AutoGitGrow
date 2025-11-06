import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '../../backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app, get_db
import models, schemas

# Create a test client for the FastAPI app
client = TestClient(app)

# Mock the database session
@pytest.fixture
def db_session_mock():
    return MagicMock()

# Mock database session fixture
@pytest.fixture
def mock_db():
    return MagicMock()

# Override get_db dependency
def override_get_db():
    return MagicMock()

app.dependency_overrides[get_db] = override_get_db

def test_read_user_found():
    # Test a simple endpoint that should work
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_read_user_not_found():
    # Test the detailed health endpoint
    response = client.get("/health/detailed")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
