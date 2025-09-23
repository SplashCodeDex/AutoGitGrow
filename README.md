[![AutoGitGrow Follower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml)
[![AutoGitGrow Unfollower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml)
[![AutoGitGrow Stargazer Actions (Manual)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml)

# AutoGitGrow 🚀

AutoGitGrow is your personal GitHub networking assistant. It's an automation tool designed to help you **grow** and **nurture** your developer network organically. With AutoGitGrow, you’ll:

* **Follow** users from our curated list, up to a configurable limit per run.
* **Unfollow** anyone who doesn’t follow you back, because **reciprocity** matters.
* **Star** and **unstar** repositories with the same give-and-take logic.

All actions run on a schedule (or on demand) in GitHub Actions, so you never need to manually review your follow list. Just set it up, sit back, and let AutoGitGrow handle your networking while you focus on coding.

- 🤔 [How it works](#how-it-works)
- ✨ [Features](#features)
- ⏭️ [Getting started](#getting-started)
- 🧪 [Local testing](#local-testing)
- ⭐ [Join our community!](#join-our-community)
- ⚙️ [Configuration](#configuration)
- 📁 [Repository structure](#repository-structure)
- 🛠️ [Manual Troubleshooting](#manual-troubleshooting-runners-optional)
- 🤝 [Contributing](#contributing)

## How it works

The motto **“You only get what you give”** drives AutoGitGrow’s behavior:

1. AutoGitGrow **follows** someone for you—chances are, they’ll notice and **follow you back** (especially if they use AutoGitGrow too!).
2. If they **don’t** reciprocate by the next run, AutoGitGrow quietly **unfollows** them.
3. You star their repo, they star yours; you unstar, AutoGitGrow unstars theirs.

## ✨ Features

- **Live Data Dashboard & AI Insights**
  - **Real-time Analytics:** A powerful web dashboard that fetches live data from the `tracker-data` branch in your repository.
  - **Track Your Growth:** See up-to-date metrics on followers gained, follow-backs, and unfollows.
  - **Visualize Progress:** An interactive chart shows your follower growth over time.
  - **Live Activity Feed:** Keep an eye on the bot's most recent actions.
  - **🧠 AI-Powered Insights with Gemini:** An "AI Insights" feature, powered by Google's Gemini API, analyzes your weekly performance and provides actionable advice. (Requires your own `API_KEY`).

- **Automated Follow / Unfollow**
  - Follows 5 to 155 fresh users each run from `config/usernames.txt` (over 91,000 active users).
  - Only targets users who have been active in the last 30 days.
  - Unfollows non-reciprocals and skips any usernames you whitelist.

- **Automated Star / Unstar Reciprocity**
  - `autotrack.py` tracks all unique stargazers across your repos.
  - `autostarback.py` automatically stars back new stargazers (with rate limits) and unstars users who unstar you.

- **Utilities & Workflows**
  - A suite of Python scripts for list cleaning, integrity checks, and more.
  - Pre-built GitHub Actions workflows for scheduled and manual runs (`run_follow.yml`, `run_unfollow.yml`, `autostar.yml`).
  - All state and logs are persisted to a dedicated `tracker-data` branch to keep your main codebase clean.

## Getting started

1. **Fork** or **clone** this repo.
2. Go to **Settings → Secrets and variables → Actions**.
   - Add a repository secret named `PAT_TOKEN` with your GitHub Personal Access Token (scopes: `user:follow`, `public_repo`).
   - Add a repository variable named `BOT_USER` with _your_ GitHub username.
3. (Optional) Add your username to `config/usernames.txt` to be discovered by others.
4. (Important) Edit `config/whitelist.txt` to protect accounts you never want the script to act on.
5. (One-time setup) Manually create an empty `tracker-data` branch. This is required for storing state files.
6. **Enable** GitHub Actions in your repo's **Actions** tab. The workflows will start running on their predefined schedules.
7. Sit back and code—**AutoGitGrow** will handle the networking for you!

## ✍️ A Note on Responsible Use

AutoGitGrow is designed to help you network organically, not to spam. Please use this tool responsibly. Automating interactions on GitHub may be against their Terms of Service. The creators of this tool are not responsible for any actions taken against your account. To stay safe:

*   Keep the follow/unfollow frequencies at a reasonable level.
*   Curate your `usernames.txt` to target relevant developers.
*   Use the `whitelist.txt` to protect accounts you value.

Remember, genuine interaction is always the best way to grow your network!

## 🧪 Local testing

1. Copy `.env.example` to `.env` and fill in your PAT.
2. Run the scripts:
```bash
# Example local run of cleanup
python scripts/cleaner.py

# Example local dry-run of follow bot
python scripts/gitgrow.py
```

## ⭐ Join our community!

Want to be discovered by other developers using this tool? It’s simple:

1. **Star** this repository, AND
2. **Follow** **[@SplashCodeDex](https://github.com/SplashCodeDex)**

Your username will be **automatically** added to the master `usernames.txt` list in a future update!

## ⚙️ Configuration

| Options             | Description                                                | Default                |
| ------------------- | ---------------------------------------------------------- | ---------------------- |
| PAT\_TOKEN          | Your PAT with `user:follow`, `public_repo` scopes. Stored in repo secrets. | **Required**   |
| USERNAME\_FILE      | File listing target usernames.                             | `config/usernames.txt` |
| WHITELIST\_FILE     | File listing usernames to protect from actions.            | `config/whitelist.txt` |
| FOLLOWERS\_PER\_RUN | Number of new users to follow each run.                    | Random: `5–155`        | 

## 📁 Repository structure

```
├── .github/
│   └── workflows/              # GitHub Actions workflows
├── config/
│   ├── usernames.txt           # 91,000+ community members
│   └── whitelist.txt           # Accounts to always skip
├── scripts/
│   ├── gitgrow.py              # Main follow/unfollow driver
│   └── ...                     # Other utility scripts
├── README.md
├── requirements.txt
└── ...
```

## 🛠️ Manual Troubleshooting Runners (optional)

If you ever need to isolate one step for debugging, head to your repo’s **Actions** tab and trigger the manual workflows:

* **AutoGitGrow Manual Follow** (`manual_follow.yml`)
* **AutoGitGrow Manual Unfollow** (`manual_unfollow.yml`)

Choose the workflow, click **Run workflow**, select your branch, and go!

## 🤝 Contributing

We love contributions! Feel free to:

1. **Open an issue** to suggest features or report bugs.
2. **Submit a pull request** to add enhancements or fixes.
3. **Star** the repository to show your support.

### With 💛 from contributors like you:

<a href="https://github.com/SplashCodeDex"><img src="https://img.shields.io/badge/SplashCodeDex-000000?style=flat&logo=github&labelColor=0057ff&color=ffffff" alt="SplashCodeDex"></a>

**Happy networking & happy coding!**