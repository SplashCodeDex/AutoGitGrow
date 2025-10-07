# Scripts

This directory contains the Python scripts that power AutoGitGrow.

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
