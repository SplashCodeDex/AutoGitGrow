import os
import random
import time
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from github import Github, GithubException

from backend.utils import logger, github_retry
import backend.crud as crud
import backend.schemas as schemas

class StarService:
    def __init__(self, db: Session):
        self.db = db
        self.token = os.getenv("GITHUB_PAT")
        self.bot_user = os.getenv("BOT_USER")
        if not self.token or not self.bot_user:
            raise ValueError("GITHUB_PAT and BOT_USER environment variables are required.")

        self.gh = Github(self.token)
        self.me = self._get_me()

    @github_retry
    def _get_me(self):
        return self.gh.get_user()

    @github_retry
    def _get_user(self, username):
        return self.gh.get_user(username)

    @github_retry
    def _star_repo(self, repo_obj):
        self.me.add_to_starred(repo_obj)

    def _record_event(self, event_type: str, target_username: str):
        # Resolve user IDs
        source_user = crud.get_user_by_username(self.db, self.bot_user)
        target_user = crud.get_user_by_username(self.db, target_username)

        # Create users if they don't exist
        if not source_user:
            source_user = crud.create_user(self.db, schemas.UserCreate(username=self.bot_user))
        if not target_user:
            target_user = crud.create_user(self.db, schemas.UserCreate(username=target_username))

        event = schemas.EventCreate(
            event_type=event_type,
            timestamp=datetime.now(timezone.utc),
            source_user_id=source_user.id,
            target_user_id=target_user.id
        )
        crud.create_event(self.db, event)

    def run_star_cycle(self, dry_run: bool = False, growth_sample: int = 10):
        logger.info("=== Starting Star Growth Cycle (Service) ===")

        # 1. Load Configuration
        base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
        usernames_path = os.path.join(base_dir, "config", "usernames.txt")

        if not os.path.exists(usernames_path):
            logger.error(f"{usernames_path} not found; cannot perform growth starring.")
            return

        # 2. Load State
        growth_starred = crud.get_growth_starred_users(self.db)

        with open(usernames_path, "r") as f:
            all_usernames = [line.strip() for line in f if line.strip()]

        # 3. Filter Candidates
        available = set(all_usernames) - set(growth_starred)
        logger.info(f"{len(available)} candidates for growth starring.")

        if not available:
            logger.info("No new candidates to star.")
            return

        sample = random.sample(list(available), min(growth_sample, len(available)))

        # 4. Process Sample
        for i, user in enumerate(sample):
            logger.info(f"[{i+1}/{len(sample)}] Processing user: {user}")

            try:
                u = self._get_user(user)
                # Get public, non-fork repos
                repos = [r for r in u.get_repos(type='owner') if not r.fork][:3]

                if not repos:
                    logger.info(f"  No public repos to star for {user}, skipping.")
                    continue

                repo = random.choice(repos)
                logger.info(f"  Starring repo: {repo.full_name}")

                if not dry_run:
                    self._star_repo(repo)
                    self._record_event("growth_star", user)
                    time.sleep(random.uniform(1, 3))

                logger.info(f"  [STARRED] {repo.full_name} for {user}")

            except Exception as e:
                logger.error(f"Error processing {user}: {e}")
                continue

        logger.info("=== Star Growth Cycle Completed ===")
