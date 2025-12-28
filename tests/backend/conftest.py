import os
import sys

# Mock environment variables required by services - MUST BE SET BEFORE BACKEND IMPORTS
os.environ["BOT_USER"] = "test_bot"
os.environ["GITHUB_PAT"] = "test_pat"
os.environ["AUTOMATION_API_KEY"] = "test_automation_key"
os.environ["SLACK_WEBHOOK_URL"] = "https://mock.slack.com"
os.environ["TESTING"] = "true"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.main import app
from backend.database import get_db, Base
from backend.auth import get_current_user

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    del app.dependency_overrides[get_db]

@pytest.fixture
def mock_current_user():
    # Helper to bypass auth
    from backend.auth import User
    mock_user = User(username="testuser", email="test@example.com", disabled=False)
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_user
    del app.dependency_overrides[get_current_user]
