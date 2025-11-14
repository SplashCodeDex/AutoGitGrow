# Scripts

This directory contains the Python scripts that power AutoGitGrow.

Quick start (local, no Docker):
- Create `.env` from `.env.example` (auto-loaded by backend not required for scripts, but you can `export` directly too)
- Required for scripts: `PAT_TOKEN` and `BOT_USER`
- Optional: `FOLLOWERS_PER_RUN`, `GITHUB_*` for workflow-related behavior
- Run: `python -u scripts/autotrack.py`, `python -u scripts/autostarback.py`, etc.

| Script | Description |
|---|---|
| `gitgrow.py` | The main script for following and unfollowing users. It follows a set number of users from `config/usernames.txt`, and also follows back any new followers. |
| `unfollowers.py` | Unfollows users who don't follow you back. |
| `autostarback.py` | Stars the repositories of users who have starred your repositories. |
| `autounstarback.py` | Unstars the repositories of users who have unstarred your repositories. |
| `autostargrow.py` | Stars the repositories of a random selection of users from `config/usernames.txt` to encourage them to check out your profile. |
| `autotrack.py` | Tracks your stargazers and saves the data to `.github/state/stargazer_state.json`. |
| `shoutouts.py` | Generates welcome and farewell messages for new and lost stargazers. |
| `maintainer.py` | Cleans the `config/usernames.txt` file by removing duplicates and users who no longer exist on GitHub. |
