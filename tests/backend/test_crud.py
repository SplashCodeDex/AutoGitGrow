import pytest
from unittest.mock import MagicMock
import sys
import os

# Add project root directory to Python path
project_root = os.path.join(os.path.dirname(__file__), '../../')
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend import crud, models, schemas

# Mock the database session
@pytest.fixture
def db_session_mock():
    return MagicMock()

def test_get_user_by_username_found(db_session_mock):
    # Arrange
    username = "testuser"
    mock_user = models.User(id=1, username=username)

    # Configure the mock session to return the mock user when queried
    db_session_mock.query.return_value.filter.return_value.first.return_value = mock_user

    # Act
    user = crud.get_user_by_username(db_session_mock, username=username)

    # Assert
    assert user == mock_user
    db_session_mock.query.assert_called_once_with(models.User)
    db_session_mock.query.return_value.filter.assert_called_once()
    db_session_mock.query.return_value.filter.return_value.first.assert_called_once()

def test_get_user_by_username_not_found(db_session_mock):
    # Arrange
    username = "nonexistentuser"

    # Configure the mock session to return None (user not found)
    db_session_mock.query.return_value.filter.return_value.first.return_value = None

    # Act
    user = crud.get_user_by_username(db_session_mock, username=username)

    # Assert
    assert user is None
    db_session_mock.query.assert_called_once_with(models.User)
    db_session_mock.query.return_value.filter.assert_called_once()
    db_session_mock.query.return_value.filter.return_value.first.assert_called_once()

def test_create_user(db_session_mock):
    # Arrange
    username = "newuser"
    user_create = schemas.UserCreate(username=username)
    mock_user = models.User(id=1, username=username)

    # Configure the mock session to return the mock user after refresh
    db_session_mock.refresh.side_effect = lambda obj: setattr(obj, 'id', mock_user.id)

    # Act
    user = crud.create_user(db_session_mock, user=user_create)

    # Assert
    assert user.username == username
    assert user.id == mock_user.id
    db_session_mock.add.assert_called_once()
    db_session_mock.commit.assert_called_once()
    db_session_mock.refresh.assert_called_once_with(user)
