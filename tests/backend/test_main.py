import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from main import app, get_db
import models, schemas

# Create a test client for the FastAPI app
client = TestClient(app)

# Mock the database session
@pytest.fixture
def db_session_mock():
    return MagicMock()

# Override the get_db dependency to use the mock session
app.dependency_overrides[get_db] = db_session_mock

def test_read_user_found(db_session_mock):
    # Arrange
    username = "testuser"
    mock_user = models.User(id=1, username=username)
    db_session_mock.query.return_value.filter.return_value.first.return_value = mock_user

    # Act
    response = client.get(f"/users/{username}")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"id": 1, "username": username}
    db_session_mock.query.assert_called_once_with(models.User)
    db_session_mock.query.return_value.filter.assert_called_once()
    db_session_mock.query.return_value.filter.return_value.first.assert_called_once()

def test_read_user_not_found(db_session_mock):
    # Arrange
    username = "nonexistentuser"
    db_session_mock.query.return_value.filter.return_value.first.return_value = None

    # Act
    response = client.get(f"/users/{username}")

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
    db_session_mock.query.assert_called_once_with(models.User)
    db_session_mock.query.return_value.filter.assert_called_once()
    db_session_mock.query.return_value.filter.return_value.first.assert_called_once()
