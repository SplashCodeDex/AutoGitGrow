[![AutoGitGrow Follower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_follow.yml)
[![AutoGitGrow Unfollower (Scheduled)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/run_unfollow.yml)
[![AutoGitGrow Stargazer Actions (Manual)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml/badge.svg)](https://github.com/SplashCodeDex/AutoGitGrow/actions/workflows/stargazer_shoutouts.yml)

# AutoGitGrow 🚀

AutoGitGrow is your personal GitHub networking assistant. It's an automation tool designed to help you **grow** and **nurture** your developer network organically. With AutoGitGrow, you’ll:

*   **Follow** users from our curated list, up to a configurable limit per run.
*   **Unfollow** anyone who doesn’t follow you back, because **reciprocity** matters.
*   **Star** and **unstar** repositories with the same give-and-take logic.

All actions run on a schedule (or on demand) in GitHub Actions, so you never need to manually review your follow list. Just set it up, sit back, and let AutoGitGrow handle your networking while you focus on coding.

- 🤔 [How it works](#how-it-works)
- ✨ [Features](#features)
- 🚀 [Getting started](#getting-started)
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
VITE_REPO_OWNER=your_repo_owner_username # e.g., SplashCodeDex
VITE_REPO_NAME=your_repo_name # e.g., AutoGitGrow
VITE_API_URL=http://localhost:8000 # For local frontend to communicate with local backend
```

*   **`PAT_TOKEN`**: Your GitHub Personal Access Token (scopes: `user:follow`, `public_repo`).
*   **`BOT_USER`**: Your GitHub username.
*   **`GEMINI_API_KEY`**: Your Google Gemini API Key (required for AI Insights).
*   **`VITE_REPO_OWNER`**: The owner of the repository where AutoGitGrow is running (e.g., `SplashCodeDex`).
*   **`VITE_REPO_NAME`**: The name of the repository where AutoGitGrow is running (e.g., `AutoGitGrow`).
*   **`VITE_API_URL`**: The URL where your backend API is accessible. For local development, this is `http://localhost:8000`.

### 3. Local Development with Docker Compose

AutoGitGrow is designed to run using Docker Compose, which orchestrates all services (backend, frontend, database, scheduler).

1.  **Ensure Docker is Running:** Make sure Docker Desktop (or your Docker daemon) is running on your machine.
2.  **Start the Application:** From the project root, run:

    ```bash
docker compose up --build
    ```

    This command will:
    *   Build the Docker images for your backend and frontend.
    *   Start all services defined in `docker-compose.yml`.
    *   Apply database migrations.

    The backend API will be available at `http://localhost:8000` and the frontend dashboard at `http://localhost:80`.

### 4. Backend API Setup (Manual - for debugging/development outside Docker)

If you need to run the backend API directly for debugging or specific development tasks outside of Docker Compose:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend server will start on `http://localhost:8000`.

### 5. Frontend Dashboard Setup (Manual - for debugging/development outside Docker)

If you need to run the frontend dashboard directly for debugging or specific development tasks outside of Docker Compose:

```bash
# From the project root directory
npm install
npm run dev
```

The frontend development server will start, usually on `http://localhost:5173`.

### 6. GitHub Actions Setup (for automation and CI/CD)

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

## 🚀 Deployment

For production deployment, it's recommended to use a Platform as a Service (PaaS) or a container orchestration platform with managed services for your database and other infrastructure components.

### Recommended Approach:

1.  **Cloud Provider:** Choose a cloud provider (e.g., DigitalOcean, Heroku, AWS, GCP, Azure).
2.  **PaaS for Application Deployment:** Deploy your Docker images to a PaaS like **DigitalOcean App Platform** or **Heroku**. These platforms simplify infrastructure management, allowing you to focus on your application.
    *   **Backend:** Your backend Docker image (`autogitgrow-backend`) will run as a service.
    *   **Frontend:** Your frontend Docker image (`autogitgrow-frontend`) will run as a web service, serving static assets via Nginx.
    *   **Scheduler:** The `scheduler` service can be deployed as a worker or cron job service within the PaaS.
3.  **Managed Database Service:** Use a managed PostgreSQL service from your chosen cloud provider (e.g., DigitalOcean Managed PostgreSQL, AWS RDS PostgreSQL). This offloads database administration tasks like backups, scaling, and maintenance.
4.  **Environment Variables:** Configure all necessary environment variables (e.g., `PAT_TOKEN`, `BOT_USER`, `DATABASE_URL`, `VITE_API_URL`) directly in your PaaS or cloud environment settings. Ensure `VITE_API_URL` points to the public URL of your deployed backend service.
5.  **Centralized Logging & Monitoring:** Leverage the built-in logging and monitoring tools of your chosen PaaS or cloud provider. Ensure your containerized applications are configured to send logs to `stdout`/`stderr` so they can be captured by these systems.
6.  **Secrets Management:** Utilize the cloud provider's secrets management service or the PaaS's built-in secrets management for sensitive information.

### Key Considerations for Production:

*   **Container Optimization:** Your Dockerfiles now use multi-stage builds and include `HEALTHCHECK` instructions, which are crucial for efficient and reliable deployments.
*   **Automated Testing:** Before deploying to production, ensure you have comprehensive unit, integration, and end-to-end tests implemented and integrated into your CI/CD pipeline. This guarantees the quality and stability of your application.
*   **Scalability:** PaaS solutions offer varying degrees of scalability. For very high-scale needs, consider a Managed Kubernetes Service (e.g., DigitalOcean Kubernetes, AWS EKS) in a later phase.

## ✍️ A Note on Responsible Use

**⚠️ IMPORTANT: This tool automates actions on your GitHub account. Excessive use can violate GitHub's Terms of Service and may lead to temporary or permanent suspension of your account. Use this tool at your own risk.**

AutoGitGrow is designed to help you network organically, not to spam. Please use this tool responsibly. Automating interactions on GitHub may be against their Terms of Service. The creators of this tool are not responsible for any actions taken against your account. To stay safe:

*   Keep the follow/unfollow frequencies at a reasonable level.
*   Curate your `usernames.txt` to target relevant developers.
*   Use the `whitelist.txt` to protect accounts you value.

Remember, genuine interaction is always the best way to grow your network!
## ✍️ A Note on Responsible Use

**⚠️ IMPORTANT: This tool automates actions on your GitHub account. Excessive use can violate GitHub's Terms of Service and may lead to temporary or permanent suspension of your account. Use this tool at your own risk.**

AutoGitGrow is designed to help you network organically, not to spam. Please use this tool responsibly. Automating interactions on GitHub may be against their Terms of Service. The creators of this tool are not responsible for any actions taken against your account. To stay safe:

*   Keep the follow/unfollow frequencies at a reasonable level.
*   Curate your `usernames.txt` to target relevant developers.
*   Use the `whitelist.txt` to protect accounts you value.

Remember, genuine interaction is always the best way to grow your network!



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
| `VITE_REPO_OWNER`   | The owner of the repository. Stored in local `.env`.                                                    | **Required**           |
| `VITE_REPO_NAME`    | The name of the repository. Stored in local `.env`.                                                     | **Required**           |
| `USERNAME_FILE`     | File listing target usernames.                                                                           | `config/usernames.txt` |
| `WHITELIST_FILE`    | File listing usernames to protect from actions.                                                         | `config/whitelist.txt` |
| `FOLLOWERS_PER_RUN` | Number of new users to follow each run.                                                                 | Random: `5–155`        |

## 📁 Repository structure

```
├── .github/
│   └── workflows/              # GitHub Actions workflows (run.yml, manual_follow.yml, etc.)
├── backend/                    # FastAPI Backend API
│   ├── crud.py                 # CRUD operations for database
│   ├── database.py             # Database connection and session
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # SQLAlchemy models
│   ├── requirements.txt        # Python dependencies for backend
│   └── schemas.py              # Pydantic schemas for data validation
├── config/
│   ├── follow_dates.json       # Stores dates for follow actions
│   ├── organizations.txt       # List of organizations
│   ├── usernames.txt           # 91,000+ community members
│   └── whitelist.txt           # Accounts to always skip
├── public/
│   ├── .gitkeep                # Placeholder for public assets
│   └── stargazer_state.json    # State for stargazer tracking
├── scripts/
│   ├── autostarback.py         # Automates starring back
│   ├── autostargrow.py         # Automates star growth
│   ├── autotrack.py            # Tracks stargazers
│   ├── autounstarback.py       # Automates unstarring
│   ├── generate_batch_size.py  # Generates batch sizes
│   ├── gitgrow.py              # Main follow/unfollow driver
│   ├── maintainer.py           # Maintenance scripts
│   ├── README.md               # Documentation for scripts
│   └── shoutouts.py            # Stargazer shoutouts
├── src/                        # Frontend source code
│   └── components/             # React components (Dashboard.tsx, etc.)
├── .env.example                # Example environment variables file
├── index.html                  # Frontend entry point
├── package.json                # Frontend dependencies and scripts
├── package-lock.json           # Frontend dependency lock file
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies for main project (if any)
├── shell.nix                   # Nix shell configuration
├── sql_app.db                  # SQLite database file
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite frontend configuration
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
