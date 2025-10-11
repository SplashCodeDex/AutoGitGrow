#!/usr/bin/env python3

import os
import sys
import json
import random
import requests
from pathlib import Path
from github import Github, GithubException

TOKEN = os.getenv("PAT_TOKEN")
BOT_USER = os.getenv("BOT_USER")
# Construct path relative to the script's parent directory
STATE_PATH = Path(__file__).parent.parent / "public" / "stargazer_state.json"

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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simulate the script execution without performing any actions")
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

    print("==== [START] autostarback.py ====")
    print(f"ENV: TOKEN={'SET' if TOKEN else 'UNSET'} BOT_USER={BOT_USER}")

    if not TOKEN or not BOT_USER:
        print("[autostarback] ERROR: PAT_TOKEN and BOT_USER required.", file=sys.stderr)
        sys.exit(1)
    if not STATE_PATH.exists():
        print(f"[autostarback] ERROR: {STATE_PATH} not found.", file=sys.stderr)
        sys.exit(1)
    print("[autostarback] State file found.")

    with open(STATE_PATH) as f:
        state = json.load(f)

    current_stargazers = set(state.get("current_stargazers", []))
    reciprocity = state.get("reciprocity", {})
    now_iso = datetime.now(timezone.utc).isoformat()
    changed = False

    print("[autostarback] Authenticating with GitHub ...")
    gh = Github(TOKEN)
    me = gh.get_user(BOT_USER)
    print(f"[autostarback] Authenticated as: {me.login}")

    print("[autostarback] Starting star-back reconciliation loop over all current stargazers ...")
    for user_idx, user in enumerate(current_stargazers, 1):
        if user not in reciprocity:
            continue

        starred_by = reciprocity[user]["starred_by"]
        starred_back = reciprocity[user].get("starred_back", [])
        needed = len(starred_by)
        current = len(starred_back)

        print(f"\n[autostarback] Processing user [{user_idx}/{len(current_stargazers)}]: {user}")
        print(f"    starred_by={needed} starred_back={current}")

        while True:
            try:
                u = gh.get_user(user)
                user_repos = [r for r in u.get_repos(type='owner') if not r.fork][:needed]
                max_possible = len(user_repos)

                # If all possible repos are already starred, but still unbalanced, log the attempt with timestamp
                if needed > max_possible and current >= max_possible:
                    print(f"[autostarback] Cannot match reciprocity for {user} (starred_by={needed}, user has only {max_possible} repos). Logging unbalanced attempt.")
                    reciprocity[user]["last_unbalanced_attempt"] = now_iso
                    changed = True
                    break

                # Star more of their repos if needed, up to the max possible
                while len(starred_back) < needed and len(user_repos) > len(starred_back):
                    repo = user_repos[len(starred_back)]
                    if not args.dry_run:
                        send_event("star", user)
                    print(f"[autostarback] Starring {repo.full_name} for {user} (to match count)")
                    try:
                        if not args.dry_run:
                            me.add_to_starred(repo)
                            time.sleep(random.uniform(1, 3))  # Add a random delay
                        starred_back.append(repo.full_name)
                        changed = True
                    except GithubException as err:
                        if err.status == 403 and 'rate limit exceeded' in err.data['message']:
                            handle_rate_limit(gh)
                            continue # Retry starring the same repo
                        else:
                            print(f"[autostarback] ERROR: Failed to star {repo.full_name} for {user}: {err}")
                            break # Break from the inner while loop

                print(f"[autostarback] Final: {user}: user_starred_yours={needed}, you_starred_theirs={len(starred_back)}")
                reciprocity[user]["starred_back"] = starred_back
                break # Break from the outer while loop

            except GithubException as e:
                if e.status == 403 and 'rate limit exceeded' in e.data['message']:
                    handle_rate_limit(gh)
                else:
                    print(f"[autostarback] ERROR processing {user}: {e}")
                    break

    # Write updated state (reciprocity only; autotrack will always overwrite on next run)
    if changed:
        state["reciprocity"] = reciprocity
        with open(STATE_PATH, "w") as f:
            json.dump(state, f, indent=2)
        print("[autostarback] State updated and saved to disk.")
    else:
        print("[autostarback] No changes to state.")

    print("==== [END] autostarback.py ====")

if __name__ == "__main__":
    main()
