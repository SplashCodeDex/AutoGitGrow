from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from backend.database import SessionLocal
import os
from datetime import datetime

router = APIRouter()

# Simple in-process metrics
metrics = {
    "automation_dispatch_count": 0,
    "automation_dispatch_failures": 0,
    "automation_last_success_timestamp": {}
}


@router.get("/metrics")
async def metrics_endpoint():
    return metrics

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "autogitgrow-backend"
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with database and system info"""
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "autogitgrow-backend",
        "checks": {}
    }
    
    # Database connectivity check
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_data["checks"]["database"] = {"status": "healthy", "message": "Connected"}
    except Exception as e:
        health_data["checks"]["database"] = {"status": "unhealthy", "message": str(e)}
        health_data["status"] = "unhealthy"
    
    # System resource check
    try:
        # Lazy import to avoid hard dependency in environments without psutil
        import psutil  # type: ignore
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        health_data["checks"]["system"] = {
            "status": "healthy",
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "cpu_percent": psutil.cpu_percent(interval=1)
        }
        
        # Alert if resources are high
        if memory.percent > 90 or disk.percent > 90:
            health_data["checks"]["system"]["status"] = "warning"
            health_data["status"] = "degraded"
            
    except Exception as e:
        health_data["checks"]["system"] = {"status": "error", "message": str(e)}
    
    # Environment check
    token_present = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
    missing_env = []
    if not token_present:
        missing_env.append("GITHUB_PAT (or PAT_TOKEN)")
    if not os.getenv("BOT_USER"):
        missing_env.append("BOT_USER")
    
    if missing_env:
        health_data["checks"]["environment"] = {
            "status": "unhealthy", 
            "missing_vars": missing_env
        }
        health_data["status"] = "unhealthy"
    else:
        health_data["checks"]["environment"] = {"status": "healthy"}
    
    return health_data

@router.get("/ready")
async def readiness_check():
    """Kubernetes-style readiness check"""
    try:
        # Check if we can connect to database
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready"}
    except Exception:
        raise HTTPException(status_code=503, detail="Service not ready")

@router.get("/live")
async def liveness_check():
    """Kubernetes-style liveness check"""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}