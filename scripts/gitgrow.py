#!/usr/bin/env python3
import os
import sys
import json
import random
import requests
from pathlib import Path
from github import Github, GithubException
from datetime import datetime, timedelta, timezone

import argparse
import time

def handle_rate_limit(gh):
    """Pauses script execution until the GitHub API rate limit is reset."""
    rate_limit = gh.get_rate_limit()
    reset_time = rate_limit.core.reset.timestamp()
    sleep_duration = max(0, reset_time - time.time())
    if sleep_duration > 0:
        print(f"[WARN] Rate limit exceeded. Sleeping for {sleep_duration:.2f} seconds.")
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
                print(f"[WARN] Could not get user_id for source_username {source_username}: {response.status_code}")

        # Get user_id for target_username
        target_user_id = None
        if target_username:
            response = requests.get(f"http://localhost:8000/users/{target_username}")
            if response.status_code == 200:
                target_user_id = response.json()["id"]
            else:
                print(f"[WARN] Could not get user_id for target_username {target_username}: {response.status_code}")

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
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Could not send event to backend: {e}")

def record_follower_count(count):
    """Records the current follower count to the backend."""
    try:
        response = requests.post(
            "http://localhost:8000/api/follower-history/",
            params={"count": count},
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Could not record follower count to backend: {e}")

def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
    args = parser.parse_args(argv)

    # — Auth & client setup —
    token = os.getenv("PAT_TOKEN")  # Retrieve GitHub token from environment variables
    if not token:
        sys.exit("PAT_TOKEN environment variable is required")  # Exit if token is not found
    gh = Github(token, retry=5, timeout=15)  # Initialize GitHub client with retry and timeout
    me = gh.get_user()  # Get authenticated user

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
    else:
        print(f"[WARN] config/whitelist.txt not found, proceeding with empty whitelist")
        whitelist = set()  # Initialize empty whitelist if file is not found

    if follow_dates_path.exists():
        with follow_dates_path.open() as f:
            follow_dates = json.load(f)
    else:
        follow_dates = {}

    # — Load a random sample of candidate usernames —
    if not user_path.exists():
        sys.exit(f"Username file not found: {user_path}")

    with user_path.open() as f:
        lines = f.readlines()
    candidates = [line.strip() for line in random.sample(lines, min(len(lines), 1000))]

    # — Fetch current following and followers lists with pagination —
    while True:
        try:
            following = {u.login.lower(): u for u in me.get_following()}
            followers = {u.login.lower() for u in me.get_followers()}
            break
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                handle_rate_limit(gh)
            else:
                sys.exit(f"[ERROR] fetching follow lists: {e}")

    # --- STEP 1: Unfollow non-reciprocal users ---
    to_unfollow = []
    for login in following:
        if login not in followers and login not in whitelist and login != me.login.lower():
            follow_date_str = follow_dates.get(login)
            if follow_date_str:
                follow_date = datetime.fromisoformat(follow_date_str)
                if datetime.now(timezone.utc) - follow_date > timedelta(days=7):
                    to_unfollow.append(login)

    unfollowed_count = 0
    for login in to_unfollow:
        user = following[login]
        while True:
            try:
                if not args.dry_run:
                    me.remove_from_following(user)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                unfollowed_count += 1
                send_event("unfollow", me.login, login)
                print(f"[UNFOLLOWED] {login}")
                if login in follow_dates:
                    del follow_dates[login]
                break
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                else:
                    print(f"[ERROR] could not unfollow {login}: {e}")
                    break

    print(f"Done unfollow phase: {unfollowed_count} unfollowed.")

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

        try:
            user = gh.get_user(login)
        except GithubException as e:
            if getattr(e, "status", None) == 404:
                notfound_new.append(login)
                print(f"[SKIP] {login} not found")
            else:
                private_new.append(login)
                print(f"[PRIVATE] {login} inaccessible: {e}")
            continue

        try:
            all_events = user.get_events()
            recent_events_count = 0
            events_processed = 0
            for event in all_events:
                if events_processed >= 30: # Process at most 30 events
                    break
                if event.created_at > datetime.now(timezone.utc) - timedelta(days=30):
                    recent_events_count += 1
                events_processed += 1
            
            if recent_events_count < 5:
                print(f"[SKIP] {login} inactive (events in last 30 days: {recent_events_count})")
                continue
        except GithubException as e:
            print(f"[WARN] could not fetch events for {login}, skipping: {e}")
            continue

        while True:
            try:
                if not args.dry_run:
                    me.add_to_following(user)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                new_followed += 1
                follow_dates[login] = datetime.now(timezone.utc).isoformat()
                send_event("follow", me.login, login)
                print(f"[FOLLOWED] {login} ({new_followed}/{per_run})")
                break
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                elif getattr(e, "status", None) == 403:
                    private_new.append(login)
                    print(f"[PRIVATE] cannot follow {login}: {e}")
                    break
                else:
                    print(f"[ERROR] follow {login}: {e}")
                    break

    print(f"Done follow phase: {new_followed}/{per_run} followed.")
    if notfound_new:
        print("Not found (skipped) during follow phase:", notfound_new)
    if private_new:
        print("Private/inaccessible (skipped) during follow phase:", private_new)

    # --- STEP 3: Follow-back your followers ---
    back_count  = 0
    private_back = []

    for login in followers:
        ll = login.lower()
        if ll == me.login.lower() or ll in whitelist or ll in following:
            continue
        while True:
            try:
                user = gh.get_user(login)
                if not args.dry_run:
                    me.add_to_following(user)
                    time.sleep(random.uniform(1, 3))  # Add a random delay
                back_count += 1
                follow_dates[login] = datetime.now(timezone.utc).isoformat()
                send_event("follow-back", me.login, login)
                print(f"[FOLLOW-BACKED] {login}")
                break
            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                elif getattr(e, "status", None) == 403:
                    private_back.append(login)
                    print(f"[PRIVATE] cannot follow-back {login}: {e}")
                    break
                else:
                    print(f"[ERROR] follow-back {login}: {e}")
                    break

    print(f"Done follow-back phase: {back_count} followed-back.")
    if private_back:
        print("Private/inaccessible skipped during follow-back:", private_back)

    # — Save follow dates —
    with follow_dates_path.open("w") as f:
        json.dump(follow_dates, f, indent=2)

    record_follower_count(me.followers)

if __name__ == "__main__":
    main()