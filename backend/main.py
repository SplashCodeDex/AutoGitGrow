from typing import List
from fastapi import Depends, FastAPI, HTTPException
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

if os.getenv("ENABLE_SQLALCHEMY_CREATE_ALL", "false").lower() == "true":
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AutoGitGrow API",
    description="GitHub automation and analytics API",
    version="2.0.0"
)

from fastapi.responses import JSONResponse

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

app = FastAPI(
    title="AutoGitGrow API",
    description="GitHub automation and analytics API",
    version="2.0.0"
)

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
# Routers
from backend.automation import router as automation_router
# Include health check routes
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(automation_router, tags=["automation"])

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception(f"An unexpected error occurred: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred. Please try again later."},
    )

# Simple in-memory rate limiter (per-IP token bucket)
from time import time
from typing import Dict

RATE_LIMIT_CAPACITY = int(os.getenv("AUTOMATION_RATE_LIMIT_CAPACITY", "10"))  # tokens
RATE_LIMIT_REFILL_PER_SEC = float(os.getenv("AUTOMATION_RATE_LIMIT_REFILL_PER_SEC", "0.5"))  # tokens/sec

_buckets: Dict[str, Dict[str, float]] = {}

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    if request.url.path.startswith("/api/automation/"):
        now = time()
        ip = request.client.host if request.client else "unknown"
        b = _buckets.get(ip)
        if not b:
            b = {"tokens": float(RATE_LIMIT_CAPACITY), "ts": now}
        else:
            elapsed = now - b["ts"]
            b["tokens"] = min(float(RATE_LIMIT_CAPACITY), b["tokens"] + elapsed * RATE_LIMIT_REFILL_PER_SEC)
            b["ts"] = now
        if b["tokens"] < 1.0:
            return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})
        b["tokens"] -= 1.0
        _buckets[ip] = b
    response = await call_next(request)
    return response

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
def create_event_for_user(event: schemas.EventCreate, db: Session = Depends(get_db)):
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
def read_stats(db: Session = Depends(get_db)):
    logger.info("Received request to read stats.")
    return crud.get_stats(db)

@app.get("/api/activity-feed", response_model=List[schemas.Event])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Received request to read activity feed with skip={skip}, limit={limit}.")
    events = crud.get_events(db, skip=skip, limit=limit)
    return events

@app.post("/api/follower-history/", response_model=schemas.FollowerHistory)
def create_follower_history(count: int, db: Session = Depends(get_db)):
    logger.info(f"Received request to create follower history with count: {count}.")
    return crud.create_follower_history(db=db, count=count)

@app.get("/api/follower-growth", response_model=List[schemas.FollowerHistory])
def read_follower_history(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.info(f"Received request to read follower history with skip={skip}, limit={limit}.")
    follower_history = crud.get_follower_history(db, skip=skip, limit=limit)
    return follower_history

@app.get("/api/reciprocity", response_model=schemas.ReciprocityData)
def read_reciprocity(db: Session = Depends(get_db)):
    logger.info("Received request to read reciprocity data.")
    return crud.get_reciprocity_data(db)

@app.post("/api/detailed-users")
def read_detailed_users(usernames: List[str], db: Session = Depends(get_db)):
    logger.info(f"Received request to read detailed users for: {usernames}.")
    return crud.get_detailed_users(db, usernames)

@app.post("/api/detailed-repositories")
def read_detailed_repositories(repo_names: List[str], db: Session = Depends(get_db)):
    logger.info(f"Received request to read detailed repositories for: {repo_names}.")
    return crud.get_detailed_repositories(db, repo_names)

@app.get("/api/user/me")
def read_current_user(db: Session = Depends(get_db)):
    logger.info("Received request to read current bot user details.")
    return crud.get_bot_user_details(db)

@app.get("/api/settings/whitelist", response_model=List[schemas.WhitelistItem])
def read_whitelist(db: Session = Depends(get_db)):
    return crud.get_whitelist(db)

@app.post("/api/settings/whitelist")
def update_whitelist(data: schemas.WhitelistUpdate, db: Session = Depends(get_db)):
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
async def generate_gemini_insight(request: schemas.GeminiInsightRequest):
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
async def analyze_user(request: schemas.UserAnalysisRequest):
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
