#!/usr/bin/env python3

import os
import sys
import json
import time
import random
from pathlib import Path
from github import Github, GithubException

BOT_USER = os.getenv("BOT_USER")
TOKEN = os.getenv("PAT_TOKEN")
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
    args = parser.parse_args()

    print("=== GitGrowBot autotrack.py started ===")
    if not TOKEN or not BOT_USER:
        print("ERROR: PAT_TOKEN and BOT_USER required", file=sys.stderr)
        sys.exit(1)
    print(f"PAT_TOKEN and BOT_USER env vars present.")
    print(f"BOT_USER: {BOT_USER}")

    print("Authenticating with GitHub...")
    gh = Github(TOKEN)
    while True:
        try:
            me = gh.get_user(BOT_USER)
            print(f"Authenticated as: {me.login}")
            break
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                handle_rate_limit(gh)
            else:
                print("ERROR: Could not authenticate with GitHub:", e)
                sys.exit(1)

    print("Collecting all public, non-fork repos owned by BOT_USER...")
    while True:
        try:
            repos = [r for r in me.get_repos(type="owner") if not r.fork and not r.private]
            print(f"Found {len(repos)} repos.")
            break
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                handle_rate_limit(gh)
            else:
                print("ERROR: Failed to list repos:", e)
                sys.exit(1)

    # Build set of all unique stargazers and their starred repos
    stargazer_set = set()
    reciprocity = {}

    for idx, repo in enumerate(repos):
        print(f"[{idx+1}/{len(repos)}] Processing repo: {repo.full_name}")
        while True:
            try:
                count = 0
                for u in repo.get_stargazers():
                    login = u.login
                    stargazer_set.add(login)
                    if login not in reciprocity:
                        reciprocity[login] = {"starred_by": [], "starred_back": []}
                    reciprocity[login]["starred_by"].append(repo.full_name)
                    count += 1
                    if count % 20 == 0:
                        print(f"    {count} stargazers fetched so far for this repo...")
                print(f"    Total stargazers fetched for {repo.full_name}: {count}")
                break
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                else:
                    print(f"    ERROR fetching stargazers for {repo.full_name}: {e}")
                    break

    current_stargazers = sorted(stargazer_set)
    print(f"Total unique stargazers across all repos: {len(current_stargazers)}")

    # Fetch all repos YOU have starred
    print("Fetching all repos starred by the bot user...")
    starred_repos = []
    while True:
        try:
            for repo in me.get_starred():
                starred_repos.append(repo)
            print(f"Bot user has starred {len(starred_repos)} repos in total.")
            break
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                handle_rate_limit(gh)
            else:
                print(f"ERROR fetching bot user's starred repos: {e}")
                break

    # For each of your starred repos, if owner is a stargazer, log as "starred_back"
    for repo in starred_repos:
        owner = repo.owner.login
        if owner in reciprocity:
            reciprocity[owner]["starred_back"].append(repo.full_name)

    # Load previous state if exists
    if STATE_PATH.exists():
        print(f"Loading previous state from {STATE_PATH} ...")
        with open(STATE_PATH, "r") as f:
            state = json.load(f)
        previous_stargazers = set(state.get("current_stargazers", []))
    else:
        print("No previous state found.")
        previous_stargazers = set()

    # Detect unstargazers: users who have unstarred since last run
    unstargazers = sorted(list(previous_stargazers - stargazer_set))
    print(f"Unstargazers detected: {len(unstargazers)}")

    top_repositories = sorted([{"name": repo.full_name, "stargazers_count": repo.stargazers_count} for repo in repos], key=lambda r: r["stargazers_count"], reverse=True)

    # Save new state
    if not args.dry_run:
        print("Saving new state ...")
        new_state = {
            "current_stargazers": current_stargazers,
            "unstargazers": unstargazers,
            "reciprocity": reciprocity,
            "top_repositories": top_repositories,
        }
        STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(STATE_PATH, "w") as f:
            json.dump(new_state, f, indent=2)
        print(f"Saved user-level stargazer state to {STATE_PATH}")
    else:
        print("Dry run, not saving state.")

    print("=== GitGrowBot autotrack.py finished ===")

if __name__ == "__main__":
    main()
