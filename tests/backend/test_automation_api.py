import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app
from backend.auth import get_current_user, User

from backend.routers.automation import get_automation_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    """Override the hybrid automation auth dependency."""
    async def override_get_automation_user():
        return User(username="testuser")
    app.dependency_overrides[get_automation_user] = override_get_automation_user
    with patch("backend.routers.automation.GrowthService"), \
         patch("backend.routers.automation.StarService"):
        yield
    app.dependency_overrides.clear()

def test_run_automation_local_success():
    resp = client.post("/api/automation/run", json={"action": "autostargrow", "execution_mode": "local"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"

def test_run_automation_gitgrow_local_success():
    resp = client.post("/api/automation/run", json={"action": "gitgrow", "execution_mode": "local"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "queued"

def test_run_automation_with_api_key():
    """Verify X-Automation-Key bypass works if configured."""
    with patch("os.getenv", side_effect=lambda k, d=None: "secret_key" if k == "AUTOMATION_API_KEY" else d):
        # Clear override to test key bypass
        app.dependency_overrides.clear()

        # Unauthorized without key
        resp = client.post("/api/automation/run", json={"action": "gitgrow", "execution_mode": "local"})
        assert resp.status_code == 401

        # Authorized with key
        resp = client.post("/api/automation/run", json={"action": "gitgrow", "execution_mode": "local"}, headers={"X-Automation-Key": "secret_key"})
        assert resp.status_code == 200

def test_run_automation_invalid_action():
    resp = client.post("/api/automation/run", json={"action": "invalid_action", "execution_mode": "local"})
    assert resp.status_code == 400

def test_run_automation_workflow_mode_unsupported():
    resp = client.post("/api/automation/run", json={"action": "autostargrow", "execution_mode": "workflow"})
    assert resp.status_code == 400
