import pytest
from unittest.mock import MagicMock, patch

@pytest.fixture
def mock_github():
    with patch("backend.services.github_service.Github") as mock_g:
        mock_instance = MagicMock()
        mock_g.return_value = mock_instance

        # Mock user
        mock_user = MagicMock()
        mock_user.login = "testuser"
        mock_user.avatar_url = "http://example.com/avatar.jpg"
        mock_user.html_url = "http://example.com/testuser"
        mock_user.name = "Test User"
        mock_user.bio = "Bio"
        mock_user.followers = 10

        mock_instance.get_user.return_value = mock_user

        yield mock_instance

@pytest.fixture
def mock_github_crud():
    """
    Separate patch for crud.py which likely imports Github directly or has its own usage.
    If crud.py uses 'from github import Github', we must patch 'backend.crud.Github'.
    """
    with patch("backend.crud.Github") as mock_g:
        mock_instance = MagicMock()
        mock_g.return_value = mock_instance

        mock_user = MagicMock()
        mock_user.login = "testuser"
        mock_user.avatar_url = "http://example.com/avatar.jpg"
        mock_user.html_url = "http://example.com/testuser"
        mock_user.name = "Test User"
        mock_user.bio = "Bio"
        mock_user.followers = 10

        mock_instance.get_user.return_value = mock_user

        yield mock_instance
