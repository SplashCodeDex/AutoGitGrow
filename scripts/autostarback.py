#!/usr/bin/env python3

import os
import sys
import json
import random
import requests
from pathlib import Path
from github import Github, GithubException

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger


TOKEN = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
BOT_USER = os.getenv("BOT_USER")
# Construct path relative to the script's parent directory
STATE_PATH = Path(__file__).parent.parent / "frontend" / "public" / "stargazer_state.json"

import argparse
import time
import functools

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

def handle_rate_limit(gh):
    """Pauses script execution until the GitHub API rate limit is reset."""
    rate_limit = gh.get_rate_limit()
    reset_time = rate_limit.core.reset.timestamp()
    sleep_duration = max(0, reset_time - time.time())
    if sleep_duration > 0:
        logger.warning(f"Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
        time.sleep(sleep_duration)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
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

    logger.info("==== [START] autostarback.py ====")
    logger.info(f"ENV: TOKEN={'SET' if TOKEN else 'UNSET'} BOT_USER={BOT_USER}")

    if not TOKEN or not BOT_USER:
        logger.error("PAT_TOKEN and BOT_USER required.")
        sys.exit(1)
    if not STATE_PATH.exists():
        logger.error(f"{STATE_PATH} not found.")
        sys.exit(1)
    logger.info("State file found.")

    with open(STATE_PATH) as f:
        state = json.load(f)

    current_stargazers = set(state.get("current_stargazers", []))
    reciprocity = state.get("reciprocity", {})
    now_iso = datetime.now(timezone.utc).isoformat()
    changed = False

    logger.info("Authenticating with GitHub ...")
    gh = Github(TOKEN)

    @github_retry
    def get_github_user_with_retry(gh_obj, username):
        return gh_obj.get_user(username)

    me = get_github_user_with_retry(gh, BOT_USER)
    logger.info(f"Authenticated as: {me.login}")

    logger.info("Starting star-back reconciliation loop over all current stargazers ...")
    for user_idx, user in enumerate(current_stargazers, 1):
        if user not in reciprocity:
            continue

        starred_by = reciprocity[user]["starred_by"]
        starred_back = reciprocity[user].get("starred_back", [])
        needed = len(starred_by)
        current = len(starred_back)

        logger.info(f"Processing user [{user_idx}/{len(current_stargazers)}]: {user}")
        logger.info(f"    starred_by={needed} starred_back={current}")

        u = get_github_user_with_retry(gh, user)
        user_repos = [r for r in u.get_repos(type='owner') if not r.fork][:needed]
        max_possible = len(user_repos)

        # If all possible repos are already starred, but still unbalanced, log the attempt with timestamp
        if needed > max_possible and current >= max_possible:
            logger.warning(f"Cannot match reciprocity for {user} (starred_by={needed}, user has only {max_possible} repos). Logging unbalanced attempt.")
            reciprocity[user]["last_unbalanced_attempt"] = now_iso
            changed = True
            continue

        # Star more of their repos if needed, up to the max possible
        while len(starred_back) < needed and len(user_repos) > len(starred_back):
            repo = user_repos[len(starred_back)]
            if not args.dry_run:
                send_event("star", user)
            logger.info(f"Starring {repo.full_name} for {user} (to match count)")
            try:
                if not args.dry_run:
                    @github_retry
                    def add_to_starred_with_retry(me_obj, repo_obj):
                        me_obj.add_to_starred(repo_obj)
                    add_to_starred_with_retry(me, repo)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                starred_back.append(repo.full_name)
                changed = True
            except GithubException as err:
                logger.error(f"Failed to star {repo.full_name} for {user}: {err}")
                break # Break from the inner while loop

        logger.info(f"Final: {user}: user_starred_yours={needed}, you_starred_theirs={len(starred_back)}")
        reciprocity[user]["starred_back"] = starred_back

    # Write updated state (reciprocity only; autotrack will always overwrite on next run)
    if changed:
        state["reciprocity"] = reciprocity
        with open(STATE_PATH, "w") as f:
            json.dump(state, f, indent=2)
        logger.info("State updated and saved to disk.")
    else:
        logger.info("No changes to state.")

    logger.info("==== [END] autostarback.py ====")

if __name__ == "__main__":
    main()
