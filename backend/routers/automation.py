from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.growth_service import GrowthService
from backend.services.star_service import StarService
from backend.utils import logger
from backend.auth import get_current_user, User  # Added for unified auth enforcement

router = APIRouter(tags=["automation"])

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
             raise HTTPException(status_code=501, detail="AutoUnstarBack service not yet implemented locally.")

        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    raise HTTPException(status_code=400, detail="Only 'local' execution mode is currently supported via this endpoint.")

@router.get("/api/automation/runs")
def get_automation_runs():
    # Placeholder for compatibility
    return []

# Unified Manual Triggers from main.py
@router.post("/api/automation/growth/run")
async def run_growth_automation(background_tasks: BackgroundTasks, dry_run: bool = False, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Triggers the Growth Automation (GitGrow) logic.
    Runs in the background.
    """
    def _run_growth():
        service = GrowthService(db)
        service.run_growth_cycle(dry_run=dry_run)

    background_tasks.add_task(_run_growth)
    return {"message": "Growth automation started in background", "dry_run": dry_run}

@router.post("/api/automation/stars/run")
async def run_star_automation(background_tasks: BackgroundTasks, dry_run: bool = False, growth_sample: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Triggers the Star Growth Automation (AutoStarGrow) logic.
    Runs in the background.
    """
    def _run_stars():
        service = StarService(db)
        service.run_star_cycle(dry_run=dry_run, growth_sample=growth_sample)

    background_tasks.add_task(_run_stars)
    return {"message": "Star growth automation started in background", "dry_run": dry_run}
