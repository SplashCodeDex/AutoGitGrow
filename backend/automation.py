import os
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.growth_service import GrowthService
from backend.services.star_service import StarService
from backend.utils import logger

router = APIRouter()

class AutomationRunRequest(BaseModel):
    action: str
    inputs: dict = {}
    ref: str = "main"
    execution_mode: str = "local" # "local" or "workflow"

class AutomationRunResponse(BaseModel):
    status: str
    message: str
    workflow: str | None = None
    ref: str | None = None
    actions_url: str | None = None

WORKFLOW_MAP = {
    "gitgrow": "gitgrow.yml",
    "autostargrow": "autostargrow.yml",
    "autounstarback": "autounstarback.yml"
}

@router.post("/api/automation/run", response_model=AutomationRunResponse)
def run_automation(
    req: AutomationRunRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    action = req.action.strip()
    logger.info(f"Automation requested: {action} (mode={req.execution_mode})")

    # For now, we override "local" execution mode to use our new Services
    # We can also support "workflow" mode if we want to keep dispatching to GitHub Actions

    if req.execution_mode == "local" or req.execution_mode == "service":
        if action == "gitgrow":
            def _run_growth():
                service = GrowthService(db)
                service.run_growth_cycle(dry_run=False)

            background_tasks.add_task(_run_growth)
            return AutomationRunResponse(
                status="queued",
                message="GitGrow automation started (Service).",
                workflow="gitgrow",
                ref="local"
            )

        elif action == "autostargrow":
            def _run_stars():
                service = StarService(db)
                service.run_star_cycle(dry_run=False)

            background_tasks.add_task(_run_stars)
            return AutomationRunResponse(
                status="queued",
                message="AutoStarGrow automation started (Service).",
                workflow="autostargrow",
                ref="local"
            )

        elif action == "autounstarback":
             # We haven't ported this yet, or it might be part of gitgrow?
             # For now, return a message or implement if needed.
             # gitgrow.py handles unfollowing, so maybe 'autounstarback' is redundant or specific?
             # Let's assume it's not supported in service mode yet.
             raise HTTPException(status_code=501, detail="AutoUnstarBack service not yet implemented locally.")

        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    # Fallback to original behavior (dispatch workflow) if mode is not local
    # But since we removed the dispatch logic in the broken file, we'll just error for now
    # or we can re-implement dispatch_workflow if needed.
    # Given the goal is "Unification", we prefer services.

    raise HTTPException(status_code=400, detail="Only 'local' execution mode is currently supported via this endpoint.")

@router.get("/api/automation/runs")
def get_automation_runs():
    # Placeholder for compatibility
    return []
