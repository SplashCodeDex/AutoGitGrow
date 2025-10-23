#!/usr/bin/env python3
import os
import sys
import json
import random
import requests
from pathlib import Path
from github import Github, GithubException
from datetime import datetime, timedelta, timezone
import functools

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger

import argparse
import time

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

def send_event(event_type, source_username, target_username, repository_name=None):
    """Sends an event to the backend."""
    try:
        # Get user_id for source_username
        source_user_id = None
        if source_username:
            response = requests.get(f"http://localhost:8000/users/{source_username}")
            if response.status_code == 200:
                source_user_id = response.json()["id"]
            else:
                logger.warning(f"Could not get user_id for source_username {source_username}: {response.status_code}")

        # Get user_id for target_username
        target_user_id = None
        if target_username:
            response = requests.get(f"http://localhost:8000/users/{target_username}")
            if response.status_code == 200:
                target_user_id = response.json()["id"]
            else:
                logger.warning(f"Could not get user_id for target_username {target_username}: {response.status_code}")

        payload = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_user_id": source_user_id,
            "target_user_id": target_user_id,
            "repository_name": repository_name,
        }

        response = requests.post(
            "http://localhost:8000/events/",
            json=payload,
        )
        response.raise_for_status()
        logger.info(f"Event sent to backend: {event_type} for {target_username}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Could not send event to backend: {e}")

def record_follower_count(count):
    """Records the current follower count to the backend."""
    try:
        response = requests.post(
            "http://localhost:8000/api/follower-history/",
            params={"count": count},
        )
        response.raise_for_status()
        logger.info(f"Recorded follower count: {count}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Could not record follower count to backend: {e}")

def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    args = parser.parse_args(argv)

    # — Auth & client setup —
    token = os.getenv("PAT_TOKEN")  # Retrieve GitHub token from environment variables
    if not token:
        logger.error("PAT_TOKEN environment variable is required")  # Exit if token is not found
        sys.exit(1)
    gh = Github(token, retry=5, timeout=15)  # Initialize GitHub client with retry and timeout
    me = gh.get_user()  # Get authenticated user
    logger.info(f"Authenticated as: {me.login}")

    # — Determine repo root & config paths —
    base_dir  = Path(__file__).parent.parent.resolve()  # Determine base directory of the repository
    user_path = base_dir / "config" / "usernames.txt"  # Path to the usernames configuration file
    white_path= base_dir / "config" / "whitelist.txt"  # Path to the whitelist configuration file
    follow_dates_path = base_dir / "config" / "follow_dates.json"
    per_run = int(os.getenv("FOLLOWERS_PER_RUN", 100))  # Number of users to follow per run, set by workflow .yml file with a fallback default value of 100

    # — Load config files —
    if white_path.exists():
        with white_path.open() as f:
            whitelist = {ln.strip().lower() for ln in f if ln.strip()}  # Load whitelist from file
        logger.info(f"Loaded {len(whitelist)} users from whitelist.txt")
    else:
        logger.warning(f"config/whitelist.txt not found, proceeding with empty whitelist")
        whitelist = set()

    if follow_dates_path.exists():
        with follow_dates_path.open() as f:
            follow_dates = json.load(f)
        logger.info(f"Loaded {len(follow_dates)} follow dates from follow_dates.json")
    else:
        follow_dates = {}
        logger.info("No follow_dates.json found, starting with empty follow dates.")

    # — Load a random sample of candidate usernames —
    if not user_path.exists():
        logger.error(f"Username file not found: {user_path}")
        sys.exit(1)

    with user_path.open() as f:
        lines = f.readlines()
    candidates = [line.strip() for line in random.sample(lines, min(len(lines), 1000))]
    logger.info(f"Loaded {len(candidates)} candidate usernames.")

    # — Fetch current following and followers lists with pagination —
    @github_retry
    def get_following_with_retry(me_obj):
        return {u.login.lower(): u for u in me_obj.get_following()}

    @github_retry
    def get_followers_with_retry(me_obj):
        return {u.login.lower() for u in me_obj.get_followers()}

    following = get_following_with_retry(me)
    followers = get_followers_with_retry(me)
    logger.info(f"Fetched {len(following)} following and {len(followers)} followers.")

    # --- STEP 1: Unfollow non-reciprocal users ---
    to_unfollow = []
    for login in following:
        if login not in followers and login not in whitelist and login != me.login.lower():
            follow_date_str = follow_dates.get(login)
            if follow_date_str:
                follow_date = datetime.fromisoformat(follow_date_str)
                if datetime.now(timezone.utc) - follow_date > timedelta(days=7):
                    to_unfollow.append(login)
    logger.info(f"Identified {len(to_unfollow)} users to unfollow.")

    unfollowed_count = 0
    for login in to_unfollow:
        user = following[login]
        
        @github_retry
        def remove_from_following_with_retry(me_obj, user_obj):
            me_obj.remove_from_following(user_obj)

        if not args.dry_run:
            remove_from_following_with_retry(me, user)
            time.sleep(random.uniform(1, 3))  # Add a random delay
        unfollowed_count += 1
        send_event("unfollow", me.login, login)
        logger.info(f"[UNFOLLOWED] {login}")
        if login in follow_dates:
            del follow_dates[login]

    logger.info(f"Done unfollow phase: {unfollowed_count} unfollowed.")

    # --- STEP 2: Follow up to per_run new users ---
    random.shuffle(candidates)
    new_followed = 0
    notfound_new = []
    private_new  = []

    for login in candidates:
        if new_followed >= per_run:
            break

        ll = login.lower()
        if ll == me.login.lower() or ll in whitelist or ll in following:
            continue

        @github_retry
        def get_github_user_with_retry(gh_obj, username):
            return gh_obj.get_user(username)

        try:
            user = get_github_user_with_retry(gh, login)
        except GithubException as e:
            if getattr(e, "status", None) == 404:
                notfound_new.append(login)
                logger.info(f"[SKIP] {login} not found")
            else:
                private_new.append(login)
                logger.warning(f"[PRIVATE] {login} inaccessible: {e}")
            continue

        @github_retry
        def get_events_with_retry(user_obj):
            return user_obj.get_events()

        try:
            all_events = get_events_with_retry(user)
            recent_events_count = 0
            events_processed = 0
            for event in all_events:
                if events_processed >= 30: # Process at most 30 events
                    break
                if event.created_at > datetime.now(timezone.utc) - timedelta(days=30):
                    recent_events_count += 1
                events_processed += 1
            
            if recent_events_count < 5:
                logger.info(f"[SKIP] {login} inactive (events in last 30 days: {recent_events_count})")
                continue
        except GithubException as e:
            logger.warning(f"could not fetch events for {login}, skipping: {e}")
            continue

        @github_retry
        def add_to_following_with_retry(me_obj, user_obj):
            me_obj.add_to_following(user_obj)

        if not args.dry_run:
            try:
                add_to_following_with_retry(me, user)
                time.sleep(random.uniform(1, 3))  # Add a random delay
            except GithubException as e:
                if getattr(e, "status", None) == 403:
                    private_new.append(login)
                    logger.warning(f"[PRIVATE] cannot follow {login}: {e}")
                else:
                    logger.error(f"follow {login}: {e}")
                continue
        new_followed += 1
        follow_dates[login] = datetime.now(timezone.utc).isoformat()
        send_event("follow", me.login, login)
        logger.info(f"[FOLLOWED] {login} ({new_followed}/{per_run})")

    logger.info(f"Done follow phase: {new_followed}/{per_run} followed.")
    if notfound_new:
        logger.info("Not found (skipped) during follow phase:", notfound_new)
    if private_new:
        logger.info("Private/inaccessible (skipped) during follow phase:", private_new)

    # --- STEP 3: Follow-back your followers ---
    back_count  = 0
    private_back = []

    for login in followers:
        ll = login.lower()
        if ll == me.login.lower() or ll in whitelist or ll in following:
            continue
        
        @github_retry
        def get_github_user_with_retry_for_follow_back(gh_obj, username):
            return gh_obj.get_user(username)

        user = get_github_user_with_retry_for_follow_back(gh, login)
        if not args.dry_run:
            try:
                add_to_following_with_retry(me, user)
                time.sleep(random.uniform(1, 3))  # Add a random delay
            except GithubException as e:
                if getattr(e, "status", None) == 403:
                    private_back.append(login)
                    logger.warning(f"[PRIVATE] cannot follow-back {login}: {e}")
                else:
                    logger.error(f"follow-back {login}: {e}")
                continue
        back_count += 1
        follow_dates[login] = datetime.now(timezone.utc).isoformat()
        send_event("follow-back", me.login, login)
        logger.info(f"[FOLLOW-BACKED] {login}")

    logger.info(f"Done follow-back phase: {back_count} followed-back.")
    if private_back:
        logger.info("Private/inaccessible skipped during follow-back:", private_back)

    # — Save follow dates —
    with follow_dates_path.open("w") as f:
        json.dump(follow_dates, f, indent=2)
    logger.info(f"Saved {len(follow_dates)} follow dates to follow_dates.json")

    record_follower_count(me.followers)

if __name__ == "__main__":
    main()