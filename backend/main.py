from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv, find_dotenv
# Auto-load environment variables for local development
load_dotenv(find_dotenv(), override=False)  # .env
load_dotenv(find_dotenv('.env.local'), override=True)  # optional overrides
import requests
import httpx
import asyncio
import time as _t
from backend.utils import logger
import backend.models as models
from backend.database import SessionLocal, engine
from backend.routers import auth, users, stats, events, settings, gemini, logs, automation, health
from backend.core.rate_limiter import RateLimitMiddleware
from backend.core.scheduler import start_scheduler, shutdown_scheduler

# Initialize DB tables
if os.getenv("ENABLE_SQLALCHEMY_CREATE_ALL", "false").lower() == "true":
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AutoGitGrow API",
    description="GitHub automation and analytics API",
    version="2.0.0"
)

# Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.exception(f"An unexpected error occurred: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check logs."},
    )

@app.on_event("startup")
async def validate_github_token():
    if os.getenv("TESTING") == "true":
        logger.info("Skipping GitHub token validation in test mode.")
        return
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
async def migrate_whitelist_on_startup():
    """Migrate whitelist from file to DB if DB is empty."""
    try:
        db = SessionLocal()
        from backend import crud
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
                            pass
                logger.info("Whitelist migration completed.")
        db.close()
    except Exception as e:
        logger.error(f"Whitelist migration failed: {e}")

@app.on_event("startup")
async def start_alert_monitor():
    if os.getenv("TESTING") == "true":
        logger.info("Skipping alert monitor in test mode.")
        return

    webhook = os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        return

    from backend.routers.health import metrics
    max_stale = int(os.getenv("ALERT_MAX_STALE_SECONDS", "3600"))
    max_fail = int(os.getenv("ALERT_MAX_FAILURES", "3"))

    async def _loop():
        async with httpx.AsyncClient() as client:
            while True:
                try:
                    now = _t.time()
                    stale = []
                    for wf, ts in metrics.get("automation_last_success_timestamp", {}).items():
                         if now - ts > max_stale:
                             stale.append((wf, int(now - ts)))
                    fails = metrics.get("automation_dispatch_failures", 0)
                    if stale or fails >= max_fail:
                         text = {"text": f"AutoGitGrow alert: stale={stale} failures={fails}"}
                         try:
                             await client.post(webhook, json=text, timeout=5)
                         except Exception:
                             pass
                    await asyncio.sleep(60)
                except Exception:
                    await asyncio.sleep(60)

    asyncio.create_task(_loop())

# CORS: restrict to configured frontend origin if provided
# CORS: restrict to configured frontend origins
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "")
if FRONTEND_ORIGIN:
    # Support comma-separated list of origins
    allow_origins = [o.strip() for o in FRONTEND_ORIGIN.split(",") if o.strip()]
else:
    # Default for local development
    allow_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Rate Limiting
app.add_middleware(RateLimitMiddleware)

# Scheduler
@app.on_event("startup")
async def init_scheduler():
    if os.getenv("TESTING") == "true":
        logger.info("Skipping scheduler initialization in test mode.")
        return
    start_scheduler()

@app.on_event("shutdown")
async def stop_scheduler():
    if os.getenv("TESTING") == "true":
        return
    shutdown_scheduler()

# Include Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, tags=["auth"])
app.include_router(users.router, tags=["users"])
app.include_router(stats.router, tags=["stats"])
app.include_router(events.router, tags=["events"])
app.include_router(settings.router, tags=["settings"])
app.include_router(gemini.router, tags=["gemini"])
app.include_router(logs.router, tags=["logs"])
app.include_router(automation.router, tags=["automation"])
