#!/usr/bin/env python3
# maintainer.py

import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from github import Github, GithubException

# Add parent directory to sys.path to allow importing from backend
sys.path.append(str(Path(__file__).parent.parent))
from backend.utils import logger

def main():
    load_dotenv()
    token = os.getenv("PAT_TOKEN")
    if not token:
        logger.critical("Error: PAT_TOKEN environment variable is required")
        sys.exit(1)
    gh = Github(token)

    base_dir      = Path(__file__).parent.parent
    username_path = base_dir / "config" / "usernames.txt"
    log_dir       = base_dir / "logs" / "maintainer"
    log_dir.mkdir(parents=True, exist_ok=True)

    if not username_path.exists():
        logger.critical(f"Error: usernames file not found at {username_path}")
        sys.exit(1)

    # Read all lines, strip and ignore blanks
    lines = [l.strip() for l in username_path.read_text().splitlines() if l.strip()]
    total = len(lines)
    if total == 0:
        logger.critical("Error: usernames.txt is empty")
        sys.exit(1)

    # --- Deduplication ---
    seen = set()
    unique = []
    duplicates = []

    for name in lines:
        lower = name.lower()
        if lower in seen:
            duplicates.append(name)
        else:
            seen.add(lower)
            unique.append(name)

    if duplicates:
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        dup_file = log_dir / f"duplicates-{ts}.txt"
        with dup_file.open("w") as f:
            for d in duplicates:
                f.write(d + "\n")
        logger.info(f"Logged {len(duplicates)} duplicates to {dup_file}")

    # --- Integrity Check ---
    missing = []
    for idx, name in enumerate(unique, 1):
        try:
            gh.get_user(name)
            logger.info(f"[{idx}/{len(unique)}] {name} - OK")
        except GithubException as e:
            if e.status == 404:
                missing.append(name)
                logger.warning(f"[{idx}/{len(unique)}] {name} - MISSING")
            else:
                logger.error(f"[{idx}/{len(unique)}] {name} - ERROR({e.status})")

    if missing:
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        miss_file = log_dir / f"missing-{ts}.txt"
        with miss_file.open("w") as f:
            f.write("\n".join(missing) + "\n")
        logger.info(f"Logged {len(missing)} missing to {miss_file}")

    # --- Update usernames.txt ---
    if duplicates or missing:
        remaining = [u for u in unique if u not in missing]
        username_path.write_text("\n".join(remaining) + "\n")
        logger.info(f"Removed {len(duplicates)} duplicates and {len(missing)} missing entries; {len(remaining)} remain.")
    else:
        logger.info("No duplicates or missing usernames found.")

if __name__ == "__main__":
    main()
