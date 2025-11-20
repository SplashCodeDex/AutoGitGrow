"""
Real GitHub Data Functions
Fetches actual data from GitHub API instead of database events.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
import os
from github import Github
from backend.utils import logger
import backend.models as models


def get_real_stats(db: Session):
    """Fetch REAL GitHub statistics from the API."""
    logger.info("Fetching REAL GitHub statistics from API.")

    bot_username = os.getenv("BOT_USER")
    if not bot_username:
        logger.error("BOT_USER environment variable not set.")
        raise HTTPException(status_code=404, detail="BOT_USER not set in .env")

    github_token = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
    if not github_token:
        logger.error("GitHub PAT not set")
        raise HTTPException(status_code=500, detail="GitHub PAT not configured")

    g = Github(github_token)

    try:
        me = g.get_user()

        # Real counts from GitHub
        followers_count = me.followers
        following_count = me.following
        public_repos = me.public_repos

        # Calculate starred repos count
        logger.info("Fetching starred repos...")
        starred_repos = list(me.get_starred())
        starred_repos_count = len(starred_repos)

        # Calculate mutuals
        logger.info("Calculating mutuals from followers and following...")
        followers_set = {f.login.lower() for f in me.get_followers()}
        following_set = {f.login.lower() for f in me.get_following()}
        mutual_followers_count = len(followers_set.intersection(following_set))

        # Database automation stats
        db_follows = db.query(models.Event).filter(models.Event.event_type == "follow").count()
        db_unfollows = db.query(models.Event).filter(models.Event.event_type == "unfollow").count()

        logger.info(f"Real Stats: Followers={followers_count}, Following={following_count}, Starred={starred_repos_count}, Mutuals={mutual_followers_count}")

        return {
            "followers": followers_count,
            "following": following_count,
            "starred_repos": starred_repos_count,
            "mutual_followers": mutual_followers_count,
            "public_repos": public_repos,
            "automation_follows": db_follows,
            "automation_unfollows": db_unfollows,
            "reciprocity_rate": (mutual_followers_count / following_count * 100) if following_count > 0 else 0
        }

    except Exception as e:
        logger.error(f"Error fetching GitHub stats: {e}")
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")


def get_real_reciprocity(db: Session):
    """Fetch REAL reciprocity data from GitHub API."""
    logger.info("Fetching REAL reciprocity data from GitHub API.")

    bot_username = os.getenv("BOT_USER")
    if not bot_username:
        logger.warning("BOT_USER environment variable not set.")
        return {"mutuals": [], "fans": [], "following_only": []}

    github_token = os.getenv("GITHUB_PAT") or os.getenv("PAT_TOKEN")
    if not github_token:
        logger.error("GitHub PAT not set")
        return {"mutuals": [], "fans": [], "following_only": []}

    g = Github(github_token)

    try:
        me = g.get_user()

        # Get real followers and following from GitHub
        logger.info("Fetching followers and following from GitHub API...")
        followers_set = {f.login for f in me.get_followers()}
        following_set = {f.login for f in me.get_following()}

        # Calculate categories
        mutuals = list(followers_set.intersection(following_set))
        fans = list(followers_set - following_set)
        following_only = list(following_set - followers_set)

        logger.info(f"Reciprocity: Mutuals={len(mutuals)}, Fans={len(fans)}, Following Only={len(following_only)}")

        return {
            "mutuals": mutuals[:100],  # Limit to avoid huge responses
            "fans": fans[:100],
            "following_only": following_only[:100]
        }

    except Exception as e:
        logger.error(f"Error fetching reciprocity data: {e}")
        return {"mutuals": [], "fans": [], "following_only": []}
