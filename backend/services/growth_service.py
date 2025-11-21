import os
import random
import time
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from github import Github, GithubException

from backend.utils import logger, github_retry
import backend.crud as crud
import backend.schemas as schemas
from backend.services.gemini_service import analyze_user_profile

class GrowthService:
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
    def _get_following(self):
        return {u.login.lower(): u for u in self.me.get_following()}

    @github_retry
    def _get_followers(self):
        return {u.login.lower() for u in self.me.get_followers()}

    @github_retry
    def _follow_user(self, user_obj):
        self.me.add_to_following(user_obj)

    @github_retry
    def _unfollow_user(self, user_obj):
        self.me.remove_from_following(user_obj)

    def _record_event(self, event_type: str, target_username: str):
        # Resolve user IDs
        source_user = crud.get_user_by_username(self.db, self.bot_user)
        target_user = crud.get_user_by_username(self.db, target_username)

        # Create users if they don't exist (lazy creation)
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

    def run_growth_cycle(self, dry_run: bool = False):
        logger.info("=== Starting Growth Cycle (Service) ===")

        # 1. Load Configuration
        whitelist_objs = crud.get_whitelist(self.db)
        whitelist = {item.username.lower() for item in whitelist_objs}
        active_follows = crud.get_active_follows(self.db) # Returns dict {username: iso_timestamp}

        # 2. Fetch GitHub State
        following = self._get_following()
        followers = self._get_followers()
        logger.info(f"Fetched {len(following)} following and {len(followers)} followers.")

        # 3. Unfollow Non-Reciprocal
        self._unfollow_non_reciprocal(following, followers, whitelist, active_follows, dry_run)

        # 4. Follow New Users
        self._follow_new_users(following, whitelist, dry_run)

        # 5. Follow Back
        self._follow_back_followers(followers, following, whitelist, dry_run)

        # 6. Record Stats
        if not dry_run:
            crud.create_follower_history(self.db, self.me.followers)

        logger.info("=== Growth Cycle Completed ===")

    def _unfollow_non_reciprocal(self, following, followers, whitelist, active_follows, dry_run):
        to_unfollow = []
        for login in following:
            if login not in followers and login not in whitelist and login != self.bot_user.lower():
                follow_date_str = active_follows.get(login)
                if follow_date_str:
                    follow_date = datetime.fromisoformat(follow_date_str)
                    # Unfollow after 7 days
                    if datetime.now(timezone.utc) - follow_date > timedelta(days=7):
                        to_unfollow.append(login)

        logger.info(f"Identified {len(to_unfollow)} users to unfollow.")

        for login in to_unfollow:
            if not dry_run:
                user = following[login]
                self._unfollow_user(user)
                self._record_event("unfollow", login)
                time.sleep(random.uniform(1, 3))
            logger.info(f"[UNFOLLOWED] {login}")

    def _follow_new_users(self, following, whitelist, dry_run):
        per_run = int(os.getenv("FOLLOWERS_PER_RUN", 100))

        # Load candidates from file (still using file for candidates source for now)
        # In future, this could come from a DB table of "Leads"
        base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
        user_path = os.path.join(base_dir, "config", "usernames.txt")

        if not os.path.exists(user_path):
            logger.warning(f"Username file not found: {user_path}")
            return

        with open(user_path, "r") as f:
            lines = f.readlines()
        candidates = [line.strip() for line in random.sample(lines, min(len(lines), 1000))]

        new_followed = 0
        for login in candidates:
            if new_followed >= per_run:
                break

            ll = login.lower()
            if ll == self.bot_user.lower() or ll in whitelist or ll in following:
                continue

            # Smart Targeting
            if os.getenv("ENABLE_SMART_TARGETING", "false").lower() == "true":
                try:
                    user_obj = self._get_user(login)
                    # We need to fetch bio/readme for analysis.
                    # _get_user returns a NamedUser, accessing bio triggers a request if not loaded?
                    # PyGithub objects are lazy.
                    analysis = analyze_user_profile(login, user_obj.bio)
                    if not analysis['is_relevant']:
                        logger.info(f"Skipping {login} due to low relevance: {analysis['reason']}")
                        continue
                except Exception as e:
                    logger.warning(f"Error in smart targeting for {login}: {e}")

            if not dry_run:
                try:
                    user_obj = self._get_user(login)
                    self._follow_user(user_obj)
                    self._record_event("follow", login)
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    logger.error(f"Failed to follow {login}: {e}")
                    continue

            new_followed += 1
            logger.info(f"[FOLLOWED] {login}")

    def _follow_back_followers(self, followers, following, whitelist, dry_run):
        for login in followers:
            ll = login.lower()
            if ll == self.bot_user.lower() or ll in whitelist or ll in following:
                continue

            if not dry_run:
                try:
                    user_obj = self._get_user(login)
                    self._follow_user(user_obj)
                    self._record_event("follow-back", login)
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    logger.error(f"Failed to follow-back {login}: {e}")
                    continue
            logger.info(f"[FOLLOW-BACKED] {login}")
