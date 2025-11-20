[![AutoGitGrow Follower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml)
[![CI/CD Pipeline](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/ci-cd-pipeline.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/ci-cd-pipeline.yml)
[![Docker Build](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/build_and_push_docker_images.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/build_and_push_docker_images.yml)
[![AutoGitGrow Unfollower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml)
[![AutoGitGrow Stargazer Actions (Manual)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml)

# AutoGitGrow 🚀

AutoGitGrow is your personal GitHub networking assistant. It's an automation tool designed to help you **grow** and **nurture** your developer network organically.

🚀 **NEW**: Enterprise-grade CI/CD pipeline with automated deployment to Render, Railway, DigitalOcean, and Docker Hub!

With AutoGitGrow, you'll:

*   **Follow** users from our curated list, up to a configurable limit per run.
*   **Unfollow** anyone who doesn’t follow you back, because **reciprocity** matters.
*   **Star** and **unstar** repositories with the same give-and-take logic.

All actions run on a schedule (or on demand) in GitHub Actions, so you never need to manually review your follow list. Just set it up, sit back, and let AutoGitGrow handle your networking while you focus on coding.

- 🤔 [How it works](#how-it-works)
- ✨ [Features](#features)
- 🚀 [Getting started](#getting-started)
- 🌐 [Production Deployment](#production-deployment)
- 🧪 [Local development](#local-development)
- ⭐ [Join our community!](#join-our-community)
- ⚙️ [Configuration](#configuration)
- 📁 [Repository structure](#repository-structure)
- 🛠️ [Manual Troubleshooting](#manual-troubleshooting-runners-optional)
- 🤝 [Contributing](#contributing)

## How it works

The motto **“You only get what you give”** drives AutoGitGrow’s behavior:

1.  AutoGitGrow **follows** someone for you—chances are, they’ll notice and **follow you back** (especially if they use AutoGitGrow too!).
2.  If they **don’t** reciprocate by the next run, AutoGitGrow quietly **unfollows** them.
3.  You star their repo, they star yours; you unstar, AutoGitGrow unstars theirs.

## ✨ Features

-   **Live Data Dashboard & AI Insights**
    *   **Real-time Analytics:** A powerful web dashboard that fetches live data from the `autogitgrow-data` repository.
    *   **Track Your Growth:** See up-to-date metrics on followers gained, follow-backs, and unfollows.
    *   **Visualize Progress:** An interactive chart shows your follower growth over time.
    *   **Live Activity Feed:** Keep an eye on the bot's most recent actions.
    *   **🧠 AI-Powered Insights with Gemini:** An "AI Insights" feature, powered by Google's Gemini API, analyzes your weekly performance and provides actionable advice. (Requires your own `GEMINI_API_KEY`).

-   **Automated Follow / Unfollow**
    *   Follows 5 to 155 fresh users each run from `config/usernames.txt` (over 91,000 active users).
    *   Only targets users who have been active in the last 30 days.
    *   Unfollows non-reciprocals and skips any usernames you whitelist.

-   **Automated Star / Unstar Reciprocity**
    *   `autotrack.py` tracks all unique stargazers across your repos.
    *   `autostarback.py` automatically stars back new stargazers (with rate limits) and unstars users who unstar you.

-   **Utilities & Workflows**
    *   A suite of Python scripts for list cleaning, integrity checks, and more.
    *   Pre-built GitHub Actions workflows for scheduled and manual runs (`run.yml`, `manual_follow.yml`, `manual_unfollow.yml`, `run_autostarback.yml`, `run_autostargrow.yml`, `run_autotrack.yml`, `run_autounstarback.yml`, `run_orgs.yml`, `stargazer_shoutouts.yml`).

## 🚀 Getting started

To get AutoGitGrow up and running, you'll need to set up both the backend API and the frontend dashboard.

### Prerequisites

*   **Git:** For cloning the repository.
*   **Docker & Docker Compose:** For running the application locally and building production images.
*   **Python 3.8+ & pip:** For the backend API and automation scripts (primarily for development/script execution outside Docker).
*   **Node.js & npm (or yarn):** For the frontend dashboard (primarily for development/build outside Docker).

### 1. Clone the repository

```bash
git clone https://github.com/SplashCodeDex/AutoGitGrow.git
cd AutoGitGrow
```

### 2. Environment Variables Setup

Create a `.env` file in the root of your project directory. This file will store sensitive information and configuration for local development. You can use `.env.example` as a template.

```
# .env file example
PAT_TOKEN=your_github_personal_access_token
BOT_USER=your_github_username
GEMINI_API_KEY=your_google_gemini_api_key
VITE_API_URL=http://localhost:8000 # For local frontend to communicate with local backend
# New (security & automation)
FRONTEND_ORIGIN=http://localhost:5173 # Restrict CORS in production to your frontend
AUTOMATION_API_KEY= # Optional: protect automation endpoints; set a strong secret in production
VITE_AUTOMATION_API_KEY= # Optional: mirror the automation key for frontend to send header
AUTOMATION_RATE_LIMIT_CAPACITY=10
AUTOMATION_RATE_LIMIT_REFILL_PER_SEC=0.5
```
- Set FRONTEND_ORIGIN in the backend to restrict CORS to your dashboard domain.
- Adjust AUTOMATION_RATE_LIMIT_* to tune per-IP rate limiting on /api/automation/*.
- Ensure your GITHUB_PAT includes the workflow scope (the backend validates and logs a warning on startup).


For automated runs on GitHub and Continuous Integration/Continuous Deployment (CI/CD), you'll need to configure repository secrets and variables:

1.  Go to your repository on GitHub: **Settings → Secrets and variables → Actions**.
2.  **Add a repository secret named `PAT_TOKEN`** with your GitHub Personal Access Token (scopes: `user:follow`, `public_repo`).
3.  **Add a repository variable named `BOT_USER`** with _your_ GitHub username.
4.  **(Optional) Add a repository secret named `GEMINI_API_KEY`** if you want to use the AI Insights feature in your GitHub Actions workflows.
5.  **For Docker Image CI/CD:**
    *   **Add a repository secret named `DOCKER_HUB_USERNAME`** with your Docker Hub username.
    *   **Add a repository secret named `DOCKER_HUB_TOKEN`** with a Docker Hub access token that has push permissions.
    *   The `build_and_push_docker_images.yml` workflow will automatically build and push your backend and frontend Docker images to Docker Hub on every push to `main`.
    *   **Note:** This workflow currently includes placeholder steps for running tests. You will need to implement actual unit, integration, and E2E tests and replace these placeholders once your tests are ready.
6.  (Optional) Add your username to `config/usernames.txt` to be discovered by others.
7.  (Important) Edit `config/whitelist.txt` to protect accounts you never want the script to act on.
8.  **Enable** GitHub Actions in your repo's **Actions** tab. The workflows will start running on their predefined schedules.
9.  Sit back and code—**AutoGitGrow** will handle the networking for you!

## 🌐 Production Deployment

AutoGitGrow is production-ready with enterprise-grade CI/CD pipelines and support for multiple deployment platforms. Choose the option that best fits your needs:

### 🚀 Quick Deploy Options

| Platform | Best For | Setup Time | Free Tier | Monthly Cost |
|----------|----------|------------|-----------|--------------|
| **🎨 [Render](https://render.com)** | MVP & Demos | 2 minutes | ✅ 750hrs | $7-15 |
| **🚄 [Railway](https://railway.app)** | Development | 1 minute | ✅ $5 credit | $5-20 |
| **🌊 [DigitalOcean](https://digitalocean.com)** | Production | 5 minutes | ❌ Paid only | $12-30 |
| **🐳 Docker Hub** | Custom Setup | Manual | ✅ Free images | Free + hosting |

### 🎯 Recommended: Render.com (2-Minute Deploy)

1. **Push your code to GitHub**
2. **Visit [render.com](https://dashboard.render.com)** and connect your GitHub repository
3. **Render auto-detects** the `render.yaml` configuration and deploys automatically
4. **Add environment variables** in Render dashboard:
   ```bash
   PAT_TOKEN=your-github-token
   BOT_USER=your-github-username
   GEMINI_API_KEY=your-gemini-key (optional)
   ```
5. **Your app is live!** 🎉

### 🛠️ One-Command Deployment (Any Platform)

```bash
# Deploy to Render
./deploy/deploy.sh render production

# Deploy to Railway
./deploy/deploy.sh railway production

# Deploy to DigitalOcean
./deploy/deploy.sh digitalocean production

# Push to Docker Hub
./deploy/deploy.sh docker-hub production
```

### 🔄 Automated CI/CD Pipeline

Every push to the `main` branch automatically:

- ✅ **Runs comprehensive tests** with PostgreSQL integration
- ✅ **Builds multi-platform Docker images** (AMD64 + ARM64)
- ✅ **Pushes to Docker Hub** and GitHub Container Registry
- ✅ **Deploys to your chosen platform** (if configured)
- ✅ **Runs security scans** with Trivy vulnerability detection

### 📋 Setup GitHub Secrets (One-time)

Add these to your GitHub repository: **Settings → Secrets and variables → Actions**

**Required for CI/CD:**
```bash
DOCKER_HUB_USERNAME=your-dockerhub-username
DOCKER_HUB_TOKEN=your-dockerhub-access-token
```

**Optional (for auto-deployment):**
```bash
RENDER_API_KEY=your-render-api-key           # For Render
RAILWAY_TOKEN=your-railway-token              # For Railway
DIGITALOCEAN_ACCESS_TOKEN=your-do-token       # For DigitalOcean
```

### 📚 Detailed Deployment Guides

- **🔐 [Secrets Setup Guide](SECRETS_SETUP_GUIDE.md)** - Complete guide to configure all required secrets
- **📖 [Complete Deployment Guide](DEPLOYMENT_GUIDE.md)** - Comprehensive platform comparison and setup
- **📋 [Deployment Checklist](.github/DEPLOYMENT_CHECKLIST.md)** - Step-by-step verification
- **🔧 [Docker Production Setup](DOCKER_PRODUCTION_SETUP.md)** - Docker optimization details

### 🧪 Test Your Deployment

```bash
# Local testing first
docker compose up --build

# Check health endpoints
curl https://your-app-url.com              # Frontend
curl https://your-api-url.com/api/stats    # Backend API
```

Your AutoGitGrow application is now enterprise-ready and can be deployed anywhere Docker is supported! 🚀

## ✍️ A Note on Responsible Use

**⚠️ IMPORTANT: This tool automates actions on your GitHub account. Excessive use can violate GitHub's Terms of Service and may lead to temporary or permanent suspension of your account. Use this tool at your own risk.**

AutoGitGrow is designed to help you network organically, not to spam. Please use this tool responsibly. Automating interactions on GitHub may be against their Terms of Service. The creators of this tool are not responsible for any actions taken against your account. To stay safe:

*   Keep the follow/unfollow frequencies at a reasonable level.
*   Curate your `usernames.txt` to target relevant developers.
*   Use the `whitelist.txt` to protect accounts you value.

Remember, genuine interaction is always the best way to grow your network!



## Local development (no Docker)

The backend now auto-loads environment variables from `.env` and optionally `.env.local` (overrides). Create a `.env` file at the repo root with values like:

```
# Frontend config
VITE_API_URL=http://localhost:8000
# Optional for Automations
GITHUB_REPO_OWNER=your-username-or-org
GITHUB_REPO_NAME=your-repo
GITHUB_PAT=ghp_xxx
# First run DB init
ENABLE_SQLALCHEMY_CREATE_ALL=true
```

Run services:
- Backend: `npm run start:backend` (FastAPI at http://localhost:8000)
- Frontend: `npm run start:frontend` (Vite at http://localhost:3000, proxies /api to backend)
- Both: `npm start`

Tips:
- Use `.env.local` to override anything locally (it will override `.env`).
- For the first backend start, set `ENABLE_SQLALCHEMY_CREATE_ALL=true` to create the SQLite tables.
- For Automations in the UI, ensure your `GITHUB_PAT` has the `workflow` scope and repo details are correct.

## ⭐ Join our community!

Want to be discovered by other developers using this tool? It’s simple:

1.  **Star** this repository, AND
2.  **Follow** **[@SplashCodeDex](https://github.com/SplashCodeDex)**

Your username will be **automatically** added to the master `usernames.txt` list in a future update!

## ⚙️ Configuration

| Options             | Description                                                                                             | Default                |
| :------------------ | :------------------------------------------------------------------------------------------------------ | :--------------------- |
| `PAT_TOKEN`         | Your PAT with `user:follow`, `public_repo` scopes. Stored in repo secrets or local `.env`.              | **Required**           |
| `BOT_USER`          | Your GitHub username. Stored in repo variables or local `.env`.                                         | **Required**           |
| `GEMINI_API_KEY`    | Your Google Gemini API Key. Stored in repo secrets or local `.env`.                                     | **Required**           |
| `USERNAME_FILE`     | File listing target usernames.                                                                           | `config/usernames.txt` |
| `WHITELIST_FILE`    | File listing usernames to protect from actions.                                                         | `config/whitelist.txt` |
| `FOLLOWERS_PER_RUN` | Number of new users to follow each run.                                                                 | Random: `5–155`        |

## 📁 Repository structure

```
├── .github/
│   └── workflows/              # GitHub Actions workflows
├── backend/                    # FastAPI Backend API
│   ├── Dockerfile              # Backend Docker image definition
│   ├── crud.py                 # CRUD operations
│   ├── database.py             # Database connection
│   ├── main.py                 # App entry point
│   ├── models.py               # SQLAlchemy models
│   ├── requirements.txt        # Python dependencies
│   ├── schemas.py              # Pydantic schemas
│   └── utils.py                # Shared utility functions
├── config/                     # Configuration files
│   ├── usernames.txt           # Target usernames
│   └── whitelist.txt           # Protected accounts
├── deploy/                     # Deployment scripts
├── docs/                       # Documentation
├── frontend/                   # Vite/React Frontend
│   ├── Dockerfile              # Frontend Docker image definition
│   ├── public/                 # Public assets (stargazer_state.json)
│   ├── src/                    # React source code
│   ├── index.html              # Entry HTML
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts          # Vite config
├── scripts/                    # Automation Scripts
│   ├── autostargrow.py         # Star growth automation
│   ├── gitgrow.py              # Main automation driver
│   └── ...                     # Other scripts
├── .env.example                # Environment variables template
├── docker-compose.yml          # Docker services definition
├── package.json                # Root orchestrator scripts
└── README.md                   # Project documentation
```

## 🛠️ Manual Troubleshooting Runners (optional)

If you ever need to isolate one step for debugging, head to your repo’s **Actions** tab and trigger the manual workflows:

*   **AutoGitGrow Manual Follow** (`manual_follow.yml`)
*   **AutoGitGrow Manual Unfollow** (`manual_unfollow.yml`)
*   **AutoGitGrow Autostarback** (`run_autostarback.yml`)
*   **AutoGitGrow Autostargrow** (`run_autostargrow.yml`)
*   **AutoGitGrow Autotrack** (`run_autotrack.yml`)
*   **AutoGitGrow Autounstarback** (`run_autounstarback.yml`)
*   **AutoGitGrow Orgs** (`run_orgs.yml`)
*   **AutoGitGrow Stargazer Shoutouts** (`stargazer_shoutouts.yml`)

Choose the workflow, click **Run workflow**, select your branch, and go!

## 🤝 Contributing

We love contributions! Feel free to:

1.  **Open an issue** to suggest features or report bugs.
2.  **Submit a pull request** to add enhancements or fixes.
3.  **Star** the repository to show your support.

### With 💛 from contributors like you:

<a href="https://github.com/SplashCodeDex"><img src="https://img.shields.io/badge/SplashCodeDex-000000?style=flat&logo=github&labelColor=0057ff&color=ffffff" alt="SplashCodeDex"></a>

**Happy networking & happy coding!**
