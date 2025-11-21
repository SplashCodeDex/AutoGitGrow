#!/usr/bin/env python3

import os
import sys
import json
import random
import requests
import time
import functools
from pathlib import Path
from datetime import datetime, timezone
from github import Github, GithubException
import argparse

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger, github_retry

BOT_USER = os.getenv("BOT_USER")
TOKEN = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
STATE_PATH = Path(__file__).parent.parent / "frontend" / "public" / "stargazer_state.json"
USERNAMES_PATH = Path(__file__).parent.parent / "config" / "usernames.txt"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    parser.add_argument("--growth-sample", type=int, default=10, help="Number of new growth users to process per run")
    args = parser.parse_args()

    def send_event(event_type, username):
        """Sends an event to the backend."""
        try:
            api_url = os.getenv("API_URL", "http://localhost:8000")
            response = requests.post(
                f"{api_url}/events/",
                params={"username": username},
                json={"event_type": event_type, "timestamp": datetime.now(timezone.utc).isoformat()},
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not send event to backend: {e}")

    logger.info("=== GitGrowBot autostargrow.py started ===")

    if not TOKEN or not BOT_USER:
        logger.error("GITHUB_PAT (or PAT_TOKEN) and BOT_USER required")
        sys.exit(1)
    logger.info(f"Token and BOT_USER env vars present.")
    logger.info(f"BOT_USER: {BOT_USER}")

    if not USERNAMES_PATH.exists():
        logger.error(f"{USERNAMES_PATH} not found; cannot perform growth starring.")
        sys.exit(1)

    logger.info("Authenticating with GitHub...")
    gh = Github(TOKEN)

    @github_retry
    def get_github_user_with_retry(gh_obj, username=None):
        if username:
            return gh_obj.get_user(username)
        return gh_obj.get_user()

    me = get_github_user_with_retry(gh)
    logger.info(f"Authenticated as: {me.login}")

    # Load growth_starred from API
    growth_starred = []
    api_url = os.getenv("API_URL", "http://localhost:8000")
    try:
        resp = requests.get(f"{api_url}/api/stars/growth")
        if resp.status_code == 200:
            growth_starred = resp.json()
            logger.info(f"Loaded {len(growth_starred)} growth starred users from API")
        else:
            logger.warning(f"Failed to fetch growth starred users from API: {resp.status_code}")
    except Exception as e:
        logger.warning(f"Failed to fetch growth starred users from API: {e}")


    # Load candidate usernames for growth
    with open(USERNAMES_PATH) as f:
        all_usernames = [line.strip() for line in f if line.strip()]
    logger.info(f"  Loaded {len(all_usernames)} usernames from {USERNAMES_PATH}")

    # Exclude already starred users
    available = set(all_usernames) - set(growth_starred)
    logger.info(f"  {len(available)} candidates for growth starring.")
    sample = random.sample(list(available), min(args.growth_sample, len(available)))

    now_iso = datetime.now(timezone.utc).isoformat()

    for i, user in enumerate(sample):
        logger.info(f"  [{i+1}/{len(sample)}] Growth star for user: {user}")

        u = get_github_user_with_retry(gh, user)
        repos = [r for r in u.get_repos(type='owner') if not r.fork][:3]
        if not repos:
            logger.info(f"    No public repos to star for {user}, skipping.")
            continue
        repo = random.choice(repos)
        logger.info(f"    Starring repo: {repo.full_name}")
        if not args.dry_run:
            @github_retry
            def add_to_starred_with_retry(me_obj, repo_obj):
                me_obj.add_to_starred(repo_obj)
            add_to_starred_with_retry(me, repo)
            time.sleep(random.uniform(1, 3))  # Add a random delay
            "starred_at": now_iso
        })
        if not args.dry_run:
            send_event("growth_star", user)

        logger.info(f"    Growth: Starred {repo.full_name} for {user} at {now_iso}")

    # Save updated growth_starred to state file
    # No longer saving to local file, as we rely on the DB events.
    # The 'growth_star' event sent via send_event() persists the action.
    logger.info("Growth star actions persisted to DB via API.")


    logger.info("=== GitGrowBot autostargrow.py finished ===")

if __name__ == "__main__":
    main()
