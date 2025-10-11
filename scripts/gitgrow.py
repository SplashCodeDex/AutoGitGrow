#!/usr/bin/env python3
import os
import sys
import json
import random
from pathlib import Path
from github import Github, GithubException
from datetime import datetime, timedelta, timezone

import argparse

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

    # — Load candidate usernames in chunks —
    if not user_path.exists():
        sys.exit(f"Username file not found: {user_path}")  # Exit if usernames file is not found

    candidates = []
    with user_path.open() as f:
        chunk = []
        for line in f:
            chunk.append(line.strip())
            if len(chunk) == 1000:
                candidates.extend(chunk)
                chunk = []
        if chunk:
            candidates.extend(chunk)

    # — Fetch current following and followers lists with pagination —
    try:
        following = {u.login.lower(): u for u in me.get_following()}
        followers = {u.login.lower() for u in me.get_followers()}
    except GithubException as e:
        if e.status == 403 and 'rate limit exceeded' in e.data['message']:
            print(f"[ERROR] Rate limit exceeded. Please wait before running the script again.")
            sys.exit(1)
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
        try:
            if not args.dry_run:
                me.remove_from_following(user)
            unfollowed_count += 1
            print(f"[UNFOLLOWED] {login}")
            if login in follow_dates:
                del follow_dates[login]
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                print(f"[ERROR] Rate limit exceeded during unfollow. Please wait before running the script again.")
                break
            print(f"[ERROR] could not unfollow {login}: {e}")

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
            events = user.get_events()
            recent_events = 0
            for event in events:
                if event.created_at > datetime.now(timezone.utc) - timedelta(days=30):
                    recent_events += 1
                else:
                    break
            if recent_events < 5:
                print(f"[SKIP] {login} inactive (events in last 30 days: {recent_events})")
                continue
        except GithubException as e:
            print(f"[WARN] could not fetch events for {login}, skipping: {e}")
            continue

        try:
            if not args.dry_run:
                me.add_to_following(user)
            new_followed += 1
            follow_dates[login] = datetime.now(timezone.utc).isoformat()
            print(f"[FOLLOWED] {login} ({new_followed}/{per_run})")
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                print(f"[ERROR] Rate limit exceeded during follow. Please wait before running the script again.")
                break
            if getattr(e, "status", None) == 403:
                private_new.append(login)
                print(f"[PRIVATE] cannot follow {login}: {e}")
            else:
                print(f"[ERROR] follow {login}: {e}")

    print(f"Done follow phase: {new_followed}/{per_run} followed.")
    if notfound_new:
        print("Not found (skipped) during follow phase:", notfound_new)
    if private_new:
        print("Private/inaccessible (skipped) during follow phase:", private_new)

    # --- STEP 3: Follow-back your followers ---
    back_count  = 0
    private_back = []

    for login, user in followers.items():
        ll = login.lower()
        if ll == me.login.lower() or ll in whitelist or ll in following:
            continue
        try:
            if not args.dry_run:
                me.add_to_following(user)
            back_count += 1
            follow_dates[login] = datetime.now(timezone.utc).isoformat()
            print(f"[FOLLOW-BACKED] {login}")
        except GithubException as e:
            if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                print(f"[ERROR] Rate limit exceeded during follow-back. Please wait before running the script again.")
                break
            if getattr(e, "status", None) == 403:
                private_back.append(login)
                print(f"[PRIVATE] cannot follow-back {login}: {e}")
            else:
                print(f"[ERROR] follow-back {login}: {e}")

    print(f"Done follow-back phase: {back_count} followed-back.")
    if private_back:
        print("Private/inaccessible skipped during follow-back:", private_back)

    # — Save follow dates —
    with follow_dates_path.open("w") as f:
        json.dump(follow_dates, f, indent=2)

if __name__ == "__main__":
    main()
