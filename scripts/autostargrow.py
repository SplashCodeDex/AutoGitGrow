#!/usr/bin/env python3

import os
import sys
import json
import random
import requests
import time
from pathlib import Path
from github import Github, GithubException
from datetime import datetime, timezone

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
        print(f"[WARN] Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
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
            print(f"[ERROR] Could not send event to backend: {e}")

    print("=== GitGrowBot autostargrow.py started ===")

    if not TOKEN or not BOT_USER:
        print("ERROR: PAT_TOKEN and BOT_USER required", file=sys.stderr)
        sys.exit(1)
    print(f"PAT_TOKEN and BOT_USER env vars present.")
    print(f"BOT_USER: {BOT_USER}")

    if not USERNAMES_PATH.exists():
        print(f"ERROR: {USERNAMES_PATH} not found; cannot perform growth starring.", file=sys.stderr)
        sys.exit(1)

    print("Authenticating with GitHub...")
    gh = Github(TOKEN)
    while True:
        try:
            me = gh.get_user()
            print(f"Authenticated as: {me.login}")
            break
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                handle_rate_limit(gh)
            else:
                print("ERROR: Could not authenticate with GitHub:", e)
                sys.exit(1)

    if not STATE_PATH.exists():
        print(f"State file {STATE_PATH} not found. Creating a new one.")
        state = {}
    else:
        print(f"Loading state from {STATE_PATH} ...")
        with open(STATE_PATH) as f:
            state = json.load(f)
    growth_starred = state.get("growth_starred", {})

    # Load candidate usernames for growth
    with open(USERNAMES_PATH) as f:
        all_usernames = [line.strip() for line in f if line.strip()]
    print(f"  Loaded {len(all_usernames)} usernames from {USERNAMES_PATH}")

    # Exclude already starred users
    available = set(all_usernames) - set(growth_starred)
    print(f"  {len(available)} candidates for growth starring.")
    sample = random.sample(list(available), min(args.growth_sample, len(available)))

    now_iso = datetime.now(timezone.utc).isoformat()

    for i, user in enumerate(sample):
        print(f"  [{i+1}/{len(sample)}] Growth star for user: {user}")
        while True:
            try:
                u = gh.get_user(user)
                repos = [r for r in u.get_repos(type='owner') if not r.fork][:3]
                if not repos:
                    print(f"    No public repos to star for {user}, skipping.")
                    break
                repo = random.choice(repos)
                print(f"    Starring repo: {repo.full_name}")
                if not args.dry_run:
                    me.add_to_starred(repo)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                growth_starred.setdefault(user, [])
                growth_starred[user].append({
                    "repo": repo.full_name,
                    "starred_at": now_iso
                })
                if not args.dry_run:
                    send_event("growth_star", user)
                print(f"    Growth: Starred {repo.full_name} for {user} at {now_iso}")
                break
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                else:
                    print(f"    Failed to star for growth {user}: {e}")
                    break

    # Save updated growth_starred to state file
    if not args.dry_run:
        print(f"Saving updated growth_starred to {STATE_PATH} ...")
        state["growth_starred"] = growth_starred
        with open(STATE_PATH, "w") as f:
            json.dump(state, f, indent=2)
        print(f"Updated growth_starred written to {STATE_PATH}")
    else:
        print("Dry run, not saving state.")

    print("=== GitGrowBot autostargrow.py finished ===")

if __name__ == "__main__":
    main()