#!/usr/bin/env python3

import os
import sys
import json
import random
import requests
import time
import functools
from pathlib import Path
from github import Github, GithubException

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger
from datetime import datetime, timezone

def github_retry(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        while True:
            try:
                return func(*args, **kwargs)
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(args[0])  # Assuming gh object is the first argument
                else:
                    logger.error(f"GitHub API error in {func.__name__}: {e}")
                    raise
    return wrapper

BOT_USER = os.getenv("BOT_USER")
TOKEN = os.getenv("PAT_TOKEN")
STATE_PATH = Path(__file__).parent.parent / "public" / "stargazer_state.json"
USERNAMES_PATH = Path(__file__).parent.parent / "config" / "usernames.txt"

def handle_rate_limit(gh):
    """Pauses script execution until the GitHub API rate limit is reset."""
    rate_limit = gh.get_rate_limit()
    reset_time = rate_limit.core.reset.timestamp()
    sleep_duration = max(0, reset_time - time.time())
    if sleep_duration > 0:
        logger.warning(f"Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
        time.sleep(sleep_duration)

import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    parser.add_argument("--growth-sample", type=int, default=10, help="Number of new growth users to process per run")
    args = parser.parse_args()

    def send_event(event_type, username):
        """Sends an event to the backend."""
        try:
            response = requests.post(
                "http://localhost:8000/events/",
                params={"username": username},
                json={"event_type": event_type, "timestamp": datetime.now(timezone.utc).isoformat()},
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not send event to backend: {e}")

    logger.info("=== GitGrowBot autostargrow.py started ===")

    if not TOKEN or not BOT_USER:
        logger.error("PAT_TOKEN and BOT_USER required")
        sys.exit(1)
    logger.info(f"PAT_TOKEN and BOT_USER env vars present.")
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

    if not STATE_PATH.exists():
        logger.info(f"State file {STATE_PATH} not found. Creating a new one.")
        state = {}
    else:
        logger.info(f"Loading state from {STATE_PATH} ...")
        with open(STATE_PATH) as f:
            state = json.load(f)
    growth_starred = state.get("growth_starred", {})

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
        growth_starred.setdefault(user, [])
        growth_starred[user].append({
            "repo": repo.full_name,
            "starred_at": now_iso
        })
        if not args.dry_run:
            send_event("growth_star", user)
        logger.info(f"    Growth: Starred {repo.full_name} for {user} at {now_iso}")

    # Save updated growth_starred to state file
    if not args.dry_run:
        logger.info(f"Saving updated growth_starred to {STATE_PATH} ...")
        state["growth_starred"] = growth_starred
        with open(STATE_PATH, "w") as f:
            json.dump(state, f, indent=2)
        logger.info(f"Updated growth_starred written to {STATE_PATH}")
    else:
        logger.info("Dry run, not saving state.")

    logger.info("=== GitGrowBot autostargrow.py finished ===")

if __name__ == "__main__":
    main()