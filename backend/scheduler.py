import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.services.growth_service import GrowthService
from backend.services.star_service import StarService

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def run_growth_job():
    """Job to run the growth cycle."""
    logger.info("Scheduler: Starting scheduled Growth Cycle...")
    db: Session = SessionLocal()
    try:
        service = GrowthService(db)
        service.run_growth_cycle(dry_run=False)
    except Exception as e:
        logger.error(f"Scheduler: Growth Cycle failed: {e}")
    finally:
        db.close()

def run_star_job():
    """Job to run the star growth cycle."""
    logger.info("Scheduler: Starting scheduled Star Cycle...")
    db: Session = SessionLocal()
    try:
        service = StarService(db)
        service.run_star_cycle(dry_run=False)
    except Exception as e:
        logger.error(f"Scheduler: Star Cycle failed: {e}")
    finally:
        db.close()

def start_scheduler():
    """Starts the scheduler and adds jobs."""
    if not scheduler.running:
        # Example: Run growth every 6 hours
        scheduler.add_job(
            run_growth_job,
            CronTrigger(hour="*/6", minute="0"),
            id="growth_job",
            replace_existing=True
        )

        # Example: Run star growth every 4 hours
        scheduler.add_job(
            run_star_job,
            CronTrigger(hour="*/4", minute="30"),
            id="star_job",
            replace_existing=True
        )

        scheduler.start()
        logger.info("Scheduler started with default jobs.")

def shutdown_scheduler():
    """Shuts down the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
