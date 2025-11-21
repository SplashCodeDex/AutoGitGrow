from typing import List
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv, find_dotenv
# Auto-load environment variables for local development
load_dotenv(find_dotenv(), override=False)  # .env
load_dotenv(find_dotenv('.env.local'), override=True)  # optional overrides
import requests
import asyncio
import time as _t
from sqlalchemy.orm import Session
from backend.utils import logger

import backend.crud as crud
import backend.models as models
import backend.schemas as schemas
from backend.database import SessionLocal, engine
from backend.health import router as health_router
from backend.automation import router as automation_router

if os.getenv("ENABLE_SQLALCHEMY_CREATE_ALL", "false").lower() == "true":
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AutoGitGrow API",
    description="GitHub automation and analytics API",
    version="2.0.0"
)

from fastapi.responses import JSONResponse, StreamingResponse
import asyncio

@app.on_event("startup")
async def validate_github_token():
    # Validate token scopes if possible
    try:
        token = os.getenv("GITHUB_PAT")
        owner = os.getenv("GITHUB_REPO_OWNER")
        repo = os.getenv("GITHUB_REPO_NAME")
        if token and owner and repo:
            headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
            r = requests.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers, timeout=10)
            # For classic tokens, GitHub returns X-OAuth-Scopes header
            scopes = r.headers.get("X-OAuth-Scopes", "")
            if scopes and "workflow" not in scopes:
                logger.warning("GITHUB_PAT may be missing 'workflow' scope. Current scopes: %s", scopes)
    except Exception as e:
        logger.warning("Token validation failed: %s", e)

@app.on_event("startup")
async def start_alert_monitor():
    # Migrate whitelist from file to DB if DB is empty
    try:
        db = SessionLocal()
        if db.query(models.Whitelist).count() == 0:
            whitelist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "whitelist.txt")
            if os.path.exists(whitelist_path):
                logger.info(f"Migrating whitelist from {whitelist_path} to database...")
                with open(whitelist_path, "r") as f:
                    usernames = [line.strip() for line in f if line.strip()]
                    for u in usernames:
                        try:
                            crud.add_whitelist_user(db, u)
                        except Exception:
                            pass # Ignore duplicates or errors during migration
                logger.info("Whitelist migration completed.")
        db.close()
    except Exception as e:
        logger.error(f"Whitelist migration failed: {e}")

    webhook = os.getenv("SLACK_WEBHOOK_URL")
    max_stale = int(os.getenv("ALERT_MAX_STALE_SECONDS", "3600"))
    max_fail = int(os.getenv("ALERT_MAX_FAILURES", "3"))
    if not webhook:
        return
    from health import metrics

    async def _loop():
        while True:
            try:
                now = _t.time()
                stale = []
                for wf, ts in metrics.get("automation_last_success_timestamp", {}).items():
                    if now - ts > max_stale:
                        stale.append((wf, int(now - ts)))
                fails = metrics.get("automation_dispatch_failures", 0)
                if stale or fails >= max_fail:
                    text = {
                        "text": f"AutoGitGrow alert: stale={stale} failures={fails}"
                    }
                    try:
                        requests.post(webhook, json=text, timeout=5)
                    except Exception:
                        pass
                await asyncio.sleep(60)
            except Exception:
                await asyncio.sleep(60)
    asyncio.create_task(_loop())



# CORS: restrict to configured frontend origin if provided
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
if FRONTEND_ORIGIN:
    allow_origins = [FRONTEND_ORIGIN]
else:
    # Default for local development: allow the Vite dev server origin
    allow_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include Routers
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(automation_router, tags=["automation"])

async def log_generator():
    """Generates a stream of log lines from autostargrow.log."""
    log_file = "autostargrow.log"
    if not os.path.exists(log_file):
        yield f"data: Log file {log_file} not found.\\n\\n"
        return

    try:
        # Open file in non-blocking mode or just read line by line
        with open(log_file, "r") as f:
            # Seek to end to only show new logs? Or show last N lines?
            # For now, let's show the last 1000 bytes and then tail
            f.seek(0, os.SEEK_END)
            file_size = f.tell()
            f.seek(max(file_size - 2000, 0), os.SEEK_SET)

            while True:
                line = f.readline()
                if line:
                    yield f"data: {line.strip()}\\n\\n"
                else:
                    await asyncio.sleep(0.5)
    except Exception as e:
        yield f"data: Error reading log file: {e}\\n\\n"

@app.get("/api/automation/logs/stream")
async def stream_logs(request: Request):
    return StreamingResponse(log_generator(), media_type="text/event-stream")

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception(f"An unexpected error occurred: {exc}")

# Authentication
from fastapi.security import OAuth2PasswordRequestForm
from backend.auth import Token, authenticate_user, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, User

@app.post("/api/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Rate Limiting
from backend.rate_limiter import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)

# Scheduler
from backend.scheduler import start_scheduler, shutdown_scheduler

@app.on_event("startup")
async def init_scheduler():
    start_scheduler()

@app.on_event("shutdown")
async def stop_scheduler():
    shutdown_scheduler()



# Dependency
def get_db():
    db = SessionLocal()
    try:
        logger.info("Database session opened.")
        yield db
    finally:
        db.close()
        logger.info("Database session closed.")


@app.post("/events/", response_model=schemas.Event)
@app.post("/api/events/", response_model=schemas.Event)
def create_event_for_user(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to create event for user: {event.source_user_id} and {event.target_user_id}")
    return crud.create_event(db=db, event=event, source_user_id=event.source_user_id, target_user_id=event.target_user_id, repository_name=event.repository_name)


@app.get("/users/{username}", response_model=schemas.User)
def read_user(username: str, db: Session = Depends(get_db)):
    logger.info(f"Received request to read user: {username}")
    db_user = crud.get_user_by_username(db, username=username)
    if db_user is None:
        logger.warning(f"User not found: {username}")
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.get("/api/stats")
def read_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read stats.")
@app.get("/api/follower-growth", response_model=List[schemas.FollowerHistory])
def read_follower_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read follower history with skip={skip}, limit={limit}.")
    follower_history = crud.get_follower_history(db, skip=skip, limit=limit)
    return follower_history

@app.get("/api/reciprocity")
def read_reciprocity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read reciprocity data.")
    from backend.crud_real_data import get_real_reciprocity
    return get_real_reciprocity(db)

@app.post("/api/detailed-users")
def read_detailed_users(usernames: List[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read detailed users for: {usernames}.")
    return crud.get_detailed_users(db, usernames)

@app.post("/api/detailed-repositories")
def read_detailed_repositories(repo_names: List[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received request to read detailed repositories for: {repo_names}.")
    return crud.get_detailed_repositories(db, repo_names)

@app.get("/api/user/me")
def read_current_user(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read current bot user details.")
    return crud.get_bot_user_details(db)

@app.get("/api/settings/whitelist", response_model=List[schemas.WhitelistItem])
def read_whitelist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.get_whitelist(db)

@app.get("/api/follows/active")
def read_active_follows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read active follows.")
    return crud.get_active_follows(db)

@app.get("/api/stars/growth")
def read_growth_starred_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to read growth starred users.")
    return crud.get_growth_starred_users(db)

@app.post("/api/settings/whitelist")
def update_whitelist(data: schemas.WhitelistUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("Received request to update whitelist.")

    # Parse the content string into a set of usernames
    new_usernames = set(line.strip() for line in data.content.split('\n') if line.strip())

    # Get current DB whitelist
    current_items = crud.get_whitelist(db)
    current_usernames = {item.username for item in current_items}

    # Add new users
    for username in new_usernames - current_usernames:
        crud.add_whitelist_user(db, username)

    # Remove users not in the new list
    for username in current_usernames - new_usernames:
        crud.remove_whitelist_user(db, username)

    return {"message": "Whitelist updated successfully."}

import google.generativeai as genai

@app.post("/api/gemini/insight")
async def generate_gemini_insight(request: schemas.GeminiInsightRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on backend.")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash') # Updated to latest flash model

        prompt = f"""
        Analyze the following weekly GitHub stats for an AutoGitGrow user.
        - Followers Gained: {request.stats.followersGained}
        - Follow-backs Received: {request.stats.followBacks}
        - Users Unfollowed: {request.stats.unfollowed}
        - New Stargazers: {request.stats.stargazers}
        - Reciprocity Rate: {request.stats.reciprocityRate}%

        Here is the follower growth data for the past week:
        {chr(10).join([f"- {d.name}: {d.followers}" for d in request.growthData])}

        Based on these stats and the growth trend, provide a structured analysis in JSON format.
        The JSON object must have the following keys:
        - "summary": A concise, encouraging, and friendly summary (2-3 sentences max). Start with a friendly greeting. End with a single, relevant emoji.
        - "suggestions": An array of 2 actionable suggestions strings for how the user could improve their GitHub presence or networking.

        Do not include any markdown formatting (like ```json). Just return the raw JSON string.
        """

        response = model.generate_content(prompt)
        # Clean up potential markdown code blocks if Gemini adds them despite instructions
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        import json
        try:
            data = json.loads(text)
            return data
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {"summary": response.text, "suggestions": []}

    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@app.post("/api/gemini/analyze-user", response_model=schemas.UserAnalysisResponse)
async def analyze_user(request: schemas.UserAnalysisRequest, current_user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on backend.")

    target_interests = os.getenv("TARGET_INTERESTS", "Python, AI, Automation, Web Development, Data Science")

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')

        prompt = f"""
        Analyze the following GitHub user profile to determine if they are relevant to my interests: {target_interests}.

        Username: {request.username}
        Bio: {request.bio or "N/A"}
        Readme Content: {request.readme_content or "N/A"}
        Recent Activity: {request.recent_activity or "N/A"}

        Task:
        1. Determine if this user is likely to be interested in similar topics or is a good candidate for networking in the fields of {target_interests}.
        2. Provide a confidence score (0.0 to 1.0).
        3. Provide a brief reason.

        Return ONLY a JSON object with the following keys:
        - "is_relevant": boolean
        - "reason": string (max 1 sentence)
        - "confidence_score": float

        Do not include markdown formatting.
        """

        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        import json
        data = json.loads(text)
        return schemas.UserAnalysisResponse(
            username=request.username,
            is_relevant=data.get("is_relevant", False),
            reason=data.get("reason", "No reason provided"),
            confidence_score=data.get("confidence_score", 0.0)
        )

    except Exception as e:
        logger.error(f"Gemini Analysis Error: {e}")
        # Fail safe: assume relevant if AI fails, or handle as needed.
        # Here we return a default response to avoid breaking the loop, but log the error.
        return schemas.UserAnalysisResponse(
            username=request.username,
            is_relevant=True, # Default to True to not block growth if AI fails
            reason="AI analysis failed, defaulting to relevant.",
            confidence_score=0.0
        )
from backend.services.growth_service import GrowthService
from backend.services.star_service import StarService
from fastapi import BackgroundTasks

@app.post("/api/automation/growth/run")
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

@app.post("/api/automation/stars/run")
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
