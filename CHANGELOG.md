## \[1.0.0] – 2025-05-19 (Pre-release)

* Initial public release of AutoGitGrow.
* Automated follow/unfollow via scheduled GitHub Actions.
* Whitelist support to protect accounts from actions.
* Configurable target user list (`usernames.txt`), deduped and checked.
* Only follows accounts active in the last 3 days.
* Username cleaner utility (dedupe, dead user removal, offline logging).
* Manual workflows for on-demand actions and isolated testing.
* Isolated config/testing infrastructure.

**Contributors:**
[@SplashCodeDex](https://github.com/SplashCodeDex)
[All commits →](https://github.com/SplashCodeDex/AutoGitGrow/commits/1.0.0)

---

## \[1.1.0] – 2025-06-04

### Added

* Menu navigation in README.
* Expanded `usernames.txt` (now over 161,000 deduplicated, active users).
* Stargazer tracking:

  * `.github/workflows/stargazer_shoutouts.yml` tracks new/lost stargazers.
  * Artifacts for each run, state persisted on `tracker-data` branch.
* Follow logic now targets only users active in last 3 days.

### Changed

* Follower batch size is now random (5–55 per run) for rate-limit safety.

### Deprecated

* `.github/workflows/run_orgs.yml` and `scripts/orgs.py` (org-member mass-follow):

  * **Deprecated due to poor results** – did not increase profile visits or organic followers.

### Maintainer-only

* Local scripts (`.env`, `scripts/cleaner.py`, `scripts/gitgrow.py` for local runs).
* Manual workflows (`manual_follow.yml`, `manual_unfollow.yml`).
* Stargazer shoutouts workflow is for repo analytics/discussion, not for general users.

**Contributors:**
[@SplashCodeDex](https://github.com/SplashCodeDex)
[All commits →](https://github.com/SplashCodeDex/AutoGitGrow/commits/1.1.0)

## [1.1.1] – 2025-06-29

### Added

* **Stargazer Reciprocity**
  - New scripts: `scripts/autostar.py` and `scripts/autotrack.py` for automated stargazer reciprocity.
    - Automatically stars a public repository for each new stargazer (subject to per-user repo limit, skip if >50 repos).
    - Unstars users who remove their star.
    - Hard limits (e.g. max 5 new stargazers and 5 growth users per run) to avoid API and rate-limit abuse.
    - Growth starring from `config/usernames.txt` still supported (sample, skip excessive repos).
* **Workflow Integration**
  - `.github/workflows/autostar.yml`: Scheduled and manual stargazer reciprocity workflow.
  - All state and log artifacts (e.g. `stargazer_state.json`) are versioned to the `tracker-data` branch and attached as workflow artifacts.
* **Documentation**
  - Updated `README.md` for new starring features, tracker-data state handling, and full setup instructions.

### Changed

* State file handling is now more robust and incremental for stargazer reciprocity.
* Documentation improved for clarity regarding analytics and reciprocity workflows.

**Contributors:**
[@SplashCodeDex](https://github.com/SplashCodeDex)
[All commits →](https://github.com/SplashCodeDex/AutoGitGrow/commits/1.1.1)

---

## [2.1.0] – 2025-11-14

### Added
- Backend auto-loads environment variables from `.env` and optional `.env.local`.
- Local development (no Docker) documentation across README, CONTRIBUTING, and Deployment Guide.

### Changed
- `.env.example` streamlined for SQLite local dev; added `ENABLE_SQLALCHEMY_CREATE_ALL` for first run.
- Secrets guide updated: clarified local vs production env handling and added non-Docker run steps.

---

## [2.0.0] – 2025-01-XX

### 🚀 Major: Enterprise CI/CD & Multi-Platform Deployment

* **Production-Ready Docker Infrastructure**
  - Fixed Docker build context transfer (reduced from 399MB to 3.7KB with comprehensive `.dockerignore`)
  - Resolved Python import issues for containerized deployment
  - Updated to Debian Bullseye for latest security patches
  - Multi-stage Docker builds with health checks and optimized layers

* **Enterprise CI/CD Pipeline**
  - Complete GitHub Actions workflow with automated testing, building, and deployment
  - Multi-platform Docker builds (AMD64 + ARM64) with build caching
  - Security scanning with Trivy vulnerability detection
  - Automated deployment to multiple platforms (Render, Railway, DigitalOcean)
  - Multi-registry support (Docker Hub + GitHub Container Registry)

* **Multi-Platform Deployment Support**
  - **Render.com**: 2-minute deployment with auto-detection
  - **Railway.app**: Developer-friendly deployment with CLI
  - **DigitalOcean App Platform**: Enterprise-grade production deployment
  - **Docker Hub**: Universal container deployment option
  - One-command deployment script: `./deploy/deploy.sh [platform] production`

* **Comprehensive Documentation**
  - Complete deployment guide with platform comparisons and costs
  - Step-by-step deployment checklist for quality assurance
  - Docker production setup documentation with troubleshooting
  - Secrets management templates and best practices

### Added

* **New Configuration Files**
  - `railway.json` for Railway.app deployment
  - `.do/app.yaml` for DigitalOcean App Platform
  - `docker-compose.test.yml` for automated testing
  - Enhanced `render.yaml` with production optimizations

* **Deployment Automation**
  - Universal deployment script (`deploy/deploy.sh`) supporting all platforms
  - Environment variable templates (`deploy/secrets-template.env`)
  - Pre-deployment testing and health checks
  - Automated rollback procedures

* **CI/CD Enhancements**
  - Enhanced GitHub Actions workflow (`.github/workflows/ci-cd-pipeline.yml`)
  - Automated testing with PostgreSQL integration
  - Build optimization with Docker layer caching
  - Multi-environment deployment support (staging/production)

### Changed

* **Docker Infrastructure Overhaul**
  - Backend Dockerfile: Multi-stage builds, security updates, health checks
  - Frontend Dockerfile: Production-optimized Nginx serving, build caching
  - Docker Compose: Environment variable externalization, service dependencies
  - Database initialization: SQLAlchemy direct instead of Alembic for simplicity

* **Import Structure (Breaking Change)**
  - All Python backend imports changed from relative to absolute for container compatibility
  - Updated `main.py`, `models.py`, `crud.py` to use absolute imports
  - Created proper Alembic configuration for future migration needs

* **Documentation Reorganization**
  - Enhanced README.md with deployment options and CI/CD information
  - Expanded CONTRIBUTING.md with deployment considerations
  - Updated environment variable documentation and examples

### Fixed

* **Critical Docker Issues**
  - Massive build context transfer due to missing `.dockerignore`
  - Python module import errors in containerized environment
  - Deprecated Debian Buster repositories causing build failures
  - Missing database initialization in production deployments

* **Production Deployment Blockers**
  - Container networking issues between frontend and backend
  - Environment variable configuration for different platforms
  - Database migration and initialization automation
  - Health check and monitoring setup

### Deployment Ready

* **Supported Platforms**: Render, Railway, DigitalOcean, Docker Hub + any Docker-compatible platform
* **Free Tier Options**: Render (750hrs), Railway ($5 credit), Docker Hub (free images)
* **Enterprise Features**: Auto-scaling, load balancing, managed databases, monitoring
* **Security**: Vulnerability scanning, secrets management, HTTPS/SSL automatic setup

**Contributors:**
[@SplashCodeDex](https://github.com/SplashCodeDex)
[All commits →](https://github.com/SplashCodeDex/AutoGitGrow/commits/2.0.0)
