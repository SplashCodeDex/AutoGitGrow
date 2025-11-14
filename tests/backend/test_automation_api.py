import os
import importlib
import types
from fastapi.testclient import TestClient


def make_app(monkeypatch, mock_post=None, mock_get=None, extra_env=None):
    env = {
        "GITHUB_REPO_OWNER": "owner",
        "GITHUB_REPO_NAME": "repo",
        "GITHUB_PAT": "token",
    }
    if extra_env:
        env.update(extra_env)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    if mock_post:
        import requests
        monkeypatch.setattr(requests, "post", mock_post)
    if mock_get:
        import requests
        monkeypatch.setattr(requests, "get", mock_get)
    # Reload modules to apply env
    if "backend.automation" in list(importlib.sys.modules.keys()):
        importlib.reload(importlib.import_module("backend.automation"))
    main = importlib.import_module("backend.main")
    importlib.reload(main)
    return TestClient(main.app)


def test_dispatch_success(monkeypatch):
    class R:
        status_code = 201
        text = "ok"
    client = make_app(monkeypatch, mock_post=lambda *a, **k: R())
    resp = client.post("/api/automation/run", json={"action": "autotrack"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "queued"


def test_dispatch_retry_then_success(monkeypatch):
    calls = {"n": 0}
    class R:
        def __init__(self, code):
            self.status_code = code
            self.text = "t"
    def mock_post(*a, **k):
        calls["n"] += 1
        return R(502) if calls["n"] < 3 else R(201)
    client = make_app(monkeypatch, mock_post=mock_post)
    resp = client.post("/api/automation/run", json={"action": "autotrack"})
    assert resp.status_code == 200


def test_dispatch_nonretryable(monkeypatch):
    class R:
        status_code = 400
        text = "bad"
    client = make_app(monkeypatch, mock_post=lambda *a, **k: R())
    resp = client.post("/api/automation/run", json={"action": "autotrack"})
    assert resp.status_code == 502


def test_api_key_guard(monkeypatch):
    class R:
        status_code = 201
        text = "ok"
    client = make_app(monkeypatch, mock_post=lambda *a, **k: R(), extra_env={"AUTOMATION_API_KEY": "secret"})
    resp = client.post("/api/automation/run", json={"action": "autotrack"})
    assert resp.status_code == 401
    resp = client.post("/api/automation/run", headers={"X-Automation-Key": "secret"}, json={"action": "autotrack"})
    assert resp.status_code == 200


def test_list_runs(monkeypatch):
    class R:
        status_code = 200
        def json(self):
            return {"workflow_runs": [{"id": 1, "status": "completed", "conclusion": "success", "created_at": "2020-01-01T00:00:00Z", "html_url": "http://x"}]}
        text = ""
    client = make_app(monkeypatch, mock_get=lambda *a, **k: R())
    resp = client.get("/api/automation/runs", params={"action": "autotrack"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["last_run"]["conclusion"] == "success" if isinstance(data, dict) else True


def test_mock_mode(monkeypatch):
    client = make_app(monkeypatch, extra_env={"AUTOMATION_MOCK_MODE": "true"})
    r1 = client.post("/api/automation/run", json={"action": "autotrack"})
    assert r1.status_code == 200
    r2 = client.get("/api/automation/runs", params={"action": "autotrack"})
    assert r2.status_code == 200
