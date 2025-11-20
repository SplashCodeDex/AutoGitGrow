#!/usr/bin/env python3

import os
import sys
import json
import time
import random
import requests
import functools
from pathlib import Path
from datetime import datetime, timezone
from github import Github, GithubException
import argparse

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger, github_retry

TOKEN = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
BOT_USER = os.getenv("BOT_USER")
STATE_PATH = Path(__file__).parent.parent / "frontend" / "public" / "stargazer_state.json"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    parser.add_argument("--days-until-unstar", type=int, default=4, help="Number of days to wait before unstarring a repository")
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

    logger.info("=== GitGrowBot autounstarback.py started ===")
    if not TOKEN:
        logger.error("GITHUB_PAT (or PAT_TOKEN) required.")
        sys.exit(1)
    if not STATE_PATH.exists():
        logger.error(f"{STATE_PATH} not found.")
        sys.exit(1)

    gh = Github(TOKEN)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    with open(STATE_PATH) as f:
        state = json.load(f)

    reciprocity = state.get("reciprocity", {})

    changed = False

    # RECIPROCITY: Keep starred_back <= starred_by
    for user, rec in reciprocity.items():
        starred_by = rec.get("starred_by", [])
        starred_back = rec.get("starred_back", [])
        excess = len(starred_back) - len(starred_by)
        # Only unstar if excess stars
        if excess > 0:
            for i in range(excess):
                repo_name = starred_back.pop()

                @github_retry
                def get_repo_with_retry(gh_obj, repo_name_str):
                    return gh_obj.get_repo(repo_name_str)

                @github_retry
                def remove_from_starred_with_retry(user_obj, repo_obj):
                    user_obj.remove_from_starred(repo_obj)

                if not args.dry_run:
                    repo = get_repo_with_retry(gh, repo_name)
                    remove_from_starred_with_retry(gh.get_user(), repo)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                if not args.dry_run:
                    send_event("unstar", user)
                logger.info(f"[over-recip] Unstarred {repo_name} for {user}")
                changed = True
            rec["starred_back"] = starred_back
            rec["last_reciprocity_update"] = now_iso

        # If cannot achieve parity due to lack of repos, record timestamp
        if len(starred_by) > len(starred_back):
            # User may not have enough public repos to restore balance
            rec["last_unbalanced_attempt"] = now_iso
            changed = True

    # Save JSON if changed
    if changed:
        state["reciprocity"] = reciprocity
        with open(STATE_PATH, "w") as f:
            json.dump(state, f, indent=2)
        logger.info("Updated state written to", STATE_PATH)
    else:
        logger.info("No changes to state.")

    logger.info("=== GitGrowBot autounstarback.py finished ===")

if __name__ == "__main__":
    main()
