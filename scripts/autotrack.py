#!/usr/bin/env python3

import os
import sys
import json
import time
import random
import functools
from pathlib import Path
from github import Github, GithubException

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger

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
    args = parser.parse_args()

    logger.info("=== GitGrowBot autotrack.py started ===")
    if not TOKEN or not BOT_USER:
        logger.error("PAT_TOKEN and BOT_USER required")
        sys.exit(1)
    logger.info(f"PAT_TOKEN and BOT_USER env vars present.")
    logger.info(f"BOT_USER: {BOT_USER}")

    logger.info("Authenticating with GitHub...")
    gh = Github(TOKEN)

    @github_retry
    def get_github_user_with_retry(gh_obj, username):
        return gh_obj.get_user(username)

    me = get_github_user_with_retry(gh, BOT_USER)
    logger.info(f"Authenticated as: {me.login}")

    logger.info("Collecting all public, non-fork repos owned by BOT_USER...")
    @github_retry
    def get_repos_with_retry(me_obj):
        return [r for r in me_obj.get_repos(type="owner") if not r.fork and not r.private]

    repos = get_repos_with_retry(me)
    logger.info(f"Found {len(repos)} repos.")

    # Build set of all unique stargazers and their starred repos
    stargazer_set = set()
    reciprocity = {}

    for idx, repo in enumerate(repos):
        logger.info(f"[{idx+1}/{len(repos)}] Processing repo: {repo.full_name}")
        
        @github_retry
        def get_stargazers_with_retry(repo_obj):
            return repo_obj.get_stargazers()

        count = 0
        for u in get_stargazers_with_retry(repo):
            login = u.login
            stargazer_set.add(login)
            if login not in reciprocity:
                reciprocity[login] = {"starred_by": [], "starred_back": []}
            reciprocity[login]["starred_by"].append(repo.full_name)
            count += 1
            if count % 20 == 0:
                logger.info(f"    {count} stargazers fetched so far for this repo...")
        logger.info(f"    Total stargazers fetched for {repo.full_name}: {count}")

    current_stargazers = sorted(stargazer_set)
    logger.info(f"Total unique stargazers across all repos: {len(current_stargazers)}")

    # Fetch all repos YOU have starred
    logger.info("Fetching all repos starred by the bot user...")
    starred_repos = []
    
    @github_retry
    def get_starred_with_retry(me_obj):
        return me_obj.get_starred()

    for repo in get_starred_with_retry(me):
        starred_repos.append(repo)
    logger.info(f"Bot user has starred {len(starred_repos)} repos in total.")

    # For each of your starred repos, if owner is a stargazer, log as "starred_back"
    for repo in starred_repos:
        owner = repo.owner.login
        if owner in reciprocity:
            reciprocity[owner]["starred_back"].append(repo.full_name)

    # Load previous state if exists
    if STATE_PATH.exists():
        logger.info(f"Loading previous state from {STATE_PATH} ...")
        with open(STATE_PATH, "r") as f:
            state = json.load(f)
        previous_stargazers = set(state.get("current_stargazers", []))
    else:
        logger.info("No previous state found.")
        previous_stargazers = set()

    # Detect unstargazers: users who have unstarred since last run
    unstargazers = sorted(list(previous_stargazers - stargazer_set))
    logger.info(f"Unstargazers detected: {len(unstargazers)}")

    top_repositories = sorted([{"name": repo.full_name, "stargazers_count": repo.stargazers_count} for repo in repos], key=lambda r: r["stargazers_count"], reverse=True)

    # Save new state
    if not args.dry_run:
        logger.info("Saving new state ...")
        new_state = {
            "current_stargazers": current_stargazers,
            "unstargazers": unstargazers,
            "reciprocity": reciprocity,
            "top_repositories": top_repositories,
        }
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(STATE_PATH, "w") as f:
            json.dump(new_state, f, indent=2)
        logger.info(f"Saved user-level stargazer state to {STATE_PATH}")
    else:
        logger.info("Dry run, not saving state.")

    logger.info("=== GitGrowBot autotrack.py finished ===")

if __name__ == "__main__":
    main()
