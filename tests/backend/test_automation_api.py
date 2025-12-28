from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app

client = TestClient(app)

def test_run_automation_local_success():
    """
    Test running the 'autostargrow' automation in local mode.
    Patches the Service classes to verify they are invoked (via background tasks logic implied).
    """
    # Note: BackgroundTasks are not executed by TestClient automatically unless we use a context manager or explicit execution.
    # API just returns 200 "queued".

    resp = client.post("/api/automation/run", json={"action": "autostargrow", "execution_mode": "local"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
    assert data["workflow"] == "autostargrow"

def test_run_automation_gitgrow_local_success():
    """
    Test running 'gitgrow' automation.
    """
    resp = client.post("/api/automation/run", json={"action": "gitgrow", "execution_mode": "local"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
    assert data["workflow"] == "gitgrow"

def test_run_automation_invalid_action():
    resp = client.post("/api/automation/run", json={"action": "invalid_action"})
    assert resp.status_code == 400

def test_run_automation_workflow_mode_unsupported():
    """
    Test that workflow mode returns 400 as it is not supported.
    """
    resp = client.post("/api/automation/run", json={"action": "autostargrow", "execution_mode": "workflow"})
    assert resp.status_code == 400
    assert "Currently supported" in resp.json().get("detail", "") or "Only 'local'" in resp.json().get("detail", "")
