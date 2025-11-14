import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import requests

router = APIRouter()

GITHUB_API_BASE = "https://api.github.com"

REQUIRE_API_KEY = os.getenv("AUTOMATION_API_KEY") is not None
API_KEY_HEADER = "X-Automation-Key"

WORKFLOW_MAP = {
    "manual_follow": "manual_follow.yml",
    "manual_unfollow": "manual_unfollow.yml",
    "autostarback": "run_autostarback.yml",
    "autostargrow": "run_autostargrow.yml",
    "autotrack": "run_autotrack.yml",
    "autounstarback": "run_autounstarback.yml",
    "stargazer_shoutouts": "stargazer_shoutouts.yml",
}

class AutomationRunRequest(BaseModel):
    action: str
    ref: str | None = None  # branch or tag to run on
    inputs: dict | None = None

class AutomationRunResponse(BaseModel):
    status: str
    message: str
    workflow: str
    ref: str
    actions_url: str | None = None


def _get_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise HTTPException(status_code=500, detail=f"Missing required environment variable: {name}")
    return v


def dispatch_workflow(workflow_file: str, ref: str, inputs: dict | None = None):
    owner = _get_env("GITHUB_REPO_OWNER")
    repo = _get_env("GITHUB_REPO_NAME")
    token = _get_env("GITHUB_PAT")

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{workflow_file}/dispatches"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AutoGitGrow-Automation"
    }
    payload = {"ref": ref}
    if inputs:
        payload["inputs"] = inputs

    # Retry with backoff for transient errors
    backoff = 0.5
    for attempt in range(5):
        r = requests.post(url, json=payload, headers=headers, timeout=20)
        if r.status_code in (201, 204):
            break
        if r.status_code in (429, 502, 503):
            import time as _t
            _t.sleep(backoff)
            backoff *= 2
            continue
        # Non-retryable
            from health import metrics
        metrics["automation_dispatch_failures"] = metrics.get("automation_dispatch_failures", 0) + 1
        raise HTTPException(status_code=502, detail=f"GitHub dispatch failed ({r.status_code}): {r.text}")
    else:
        raise HTTPException(status_code=502, detail=f"GitHub dispatch failed after retries: {r.status_code} {r.text}")

        from health import metrics
    metrics["automation_dispatch_count"] = metrics.get("automation_dispatch_count", 0) + 1
    return {
        "actions_url": f"https://github.com/{owner}/{repo}/actions"
    }


def list_workflow_runs(workflow_file: str, per_page: int = 1):
    owner = _get_env("GITHUB_REPO_OWNER")
    repo = _get_env("GITHUB_REPO_NAME")
    token = _get_env("GITHUB_PAT")

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{workflow_file}/runs?per_page={per_page}"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "AutoGitGrow-Automation"
    }
    # Retry with backoff
    backoff = 0.5
    for attempt in range(5):
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code == 200:
            break
        if r.status_code in (429, 502, 503):
            import time as _t
            _t.sleep(backoff)
            backoff *= 2
            continue
        raise HTTPException(status_code=502, detail=f"GitHub list runs failed ({r.status_code}): {r.text}")
    else:
        raise HTTPException(status_code=502, detail=f"GitHub list runs failed after retries: {r.status_code} {r.text}")
    data = r.json()
    runs = data.get("workflow_runs", [])
    if not runs:
        return None
    run = runs[0]
    return {
        "id": run.get("id"),
        "status": run.get("status"),
        "conclusion": run.get("conclusion"),
        "created_at": run.get("created_at"),
        "html_url": run.get("html_url")
    }


@router.post("/api/automation/run", response_model=AutomationRunResponse)
def run_automation(req: AutomationRunRequest, request: Request):
    # Optional API key guard
    if REQUIRE_API_KEY:
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key or api_key != os.getenv("AUTOMATION_API_KEY"):
            raise HTTPException(status_code=401, detail="Unauthorized: missing or invalid automation API key")
    action = req.action.strip()
    if action not in WORKFLOW_MAP:
        raise HTTPException(status_code=400, detail=f"Unsupported action '{action}'. Supported: {', '.join(WORKFLOW_MAP.keys())}")

    workflow_file = WORKFLOW_MAP[action]
    ref = req.ref or os.getenv("AUTOMATION_DEFAULT_REF", "main")

        # Audit log
    client_ip = request.client.host if request.client else 'unknown'
    os.environ.get('')  # no-op to avoid unused import warnings
    print(f"[audit] automation_run action={action} ip={client_ip} ref={ref}")

    result = dispatch_workflow(workflow_file, ref, req.inputs)

    return AutomationRunResponse(
        status="queued",
        message=f"Workflow '{workflow_file}' dispatched on ref '{ref}'.",
        workflow=workflow_file,
        ref=ref,
        actions_url=result.get("actions_url")
    )


class AutomationRunInfo(BaseModel):
    action: str
    workflow: str
    last_run: dict | None = None


@router.get("/api/automation/runs")
def get_automation_runs(action: str | None = None, request: Request = None, per_page: int = 1):
    # Optional API key guard
    if REQUIRE_API_KEY:
        if request is None or request.headers.get(API_KEY_HEADER) != os.getenv("AUTOMATION_API_KEY"):
            raise HTTPException(status_code=401, detail="Unauthorized: missing or invalid automation API key")

    if action:
        if action not in WORKFLOW_MAP:
            raise HTTPException(status_code=400, detail=f"Unsupported action '{action}'. Supported: {', '.join(WORKFLOW_MAP.keys())}")
        wf = WORKFLOW_MAP[action]
        last = list_workflow_runs(wf, per_page=per_page)
        return AutomationRunInfo(action=action, workflow=wf, last_run=last)

    # If no action provided, return latest for all
        results = []
    for a, wf in WORKFLOW_MAP.items():
        last = list_workflow_runs(wf, per_page=per_page)
        results.append(AutomationRunInfo(action=a, workflow=wf, last_run=last))
    return results
