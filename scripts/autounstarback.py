#!/usr/bin/env python3

import os
import sys
import json
import time
import random
import requests
from pathlib import Path
from github import Github, GithubException
from datetime import datetime, timedelta, timezone

TOKEN = os.getenv("PAT_TOKEN")
BOT_USER = os.getenv("BOT_USER")
STATE_PATH = Path(__file__).parent.parent / "public" / "stargazer_state.json"

def handle_rate_limit(gh):
    """Pauses script execution until the GitHub API rate limit is reset."""
    rate_limit = gh.get_rate_limit()
    reset_time = rate_limit.core.reset.timestamp()
    sleep_duration = max(0, reset_time - time.time())
    if sleep_duration > 0:
        print(f"[WARN] Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
        time.sleep(sleep_duration)

import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    parser.add_argument("--days-until-unstar", type=int, default=4, help="Number of days to wait before unstarring a repository")
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
            print(f"[ERROR] Could not send event to backend: {e}")

    print("=== GitGrowBot autounstarback.py started ===")
    if not TOKEN:
        print("ERROR: PAT_TOKEN required.", file=sys.stderr)
        sys.exit(1)
    if not STATE_PATH.exists():
        print(f"ERROR: {STATE_PATH} not found.", file=sys.stderr)
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
                while True:
                    try:
                        if not args.dry_run:
                            repo = gh.get_repo(repo_name)
                            gh.get_user().remove_from_starred(repo)
                            time.sleep(random.uniform(1, 3))  # Add a random delay
                        if not args.dry_run:
                            send_event("unstar", user)
                        print(f"[over-recip] Unstarred {repo_name} for {user}")
                        changed = True
                        break
                    except GithubException as e:
                        if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                            handle_rate_limit(gh)
                        else:
                            print(f"  Warning: could not unstar {repo_name}: {e}")
                            break
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
        print("Updated state written to", STATE_PATH)
    else:
        print("No changes to state.")

    print("=== GitGrowBot autounstarback.py finished ===")

if __name__ == "__main__":
    main()
