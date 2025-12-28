# AutoGitGrow Project Rules & Standards

This document serves as the single source of truth for architectural standards, coding conventions, and contribution guidelines for the AutoGitGrow codebase.

## 1. Project Overview & Architecture

AutoGitGrow is a monorepo containing a full-stack application designed for GitHub network automation.
*   **Backend**: Python (FastAPI) located in `backend/`.
*   **Frontend**: React (Vite, TypeScript, Tailwind CSS) located in `frontend/`.
*   **Infrastructure**: Docker, GitHub Actions CI/CD.

### Architectural constraints:
*   **Separation of Concerns**: Business logic belongs in the backend. The frontend should only handle presentation and API consumption.
*   **API Design**: Use RESTful principles. Group routes by resource in `backend/routers/`.
*   **State Management**: Use `TanStack Query` (React Query) for server state and `Jotai` for client state in the frontend.

## 2. Coding Standards

### Backend (Python)
*   **Framework**: FastAPI.
*   **Type Hinting**: All functions must be type-hinted. Enforced by `mypy`.
*   **Linting & Formatting**: Enforced by `ruff`. Run `ruff check .` and `ruff format .` before committing.
*   **Database**:
    *   Use SQLAlchemy ORM for database interactions.
    *   Use Pydantic models (`schemas.py`) for data validation and serialization (DTOs).
    *   Database migrations must be managed with `alembic`.
*   **Structure**:
    *   `models.py`: SQLAlchemy database models.
    *   `schemas.py`: Pydantic schemas (Request/Response).
    *   `crud.py`: Database operations.
    *   `routers/`: API route handlers.
    *   `services/`: Complex business logic (e.g., `GrowthService`).
*   **API Naming Conventions**:
    *   **JSON Response**: MUST use **camelCase**.
    *   **Python Models**: Define Pydantic models with **snake_case** attributes but inherit from `CamelModel` (in `schemas.py`) to automatically serialize to camelCase.
    *   **Frontend Usage**: All API interactions must use camelCase property references.
*   **Async/Await**: Use `async def` for route handlers, especially those involving I/O (but note that standard SQLAlchemy `Session` is synchronous; use regular `def` if blocking significantly, or switch to `AsyncSession` if needed in future).

### Frontend (TypeScript/React)
*   **Framework**: React 18+ with Vite.
*   **Styling**:
    *   Use **Tailwind CSS** (v4) for styling.
    *   Use `shadcn/ui` components located in `components/ui/`.
    *   Avoid custom CSS files unless absolutely necessary (use `index.css` for globals).
*   **Components**:
    *   Functional components only.
    *   Use strict TypeScript checks (no `any`).
    *   Colocate logic with components where possible, or abstract into custom hooks in `lib/hooks/`.
*   **Linting & Formatting**:
    *   Enforced by **ESLint** and **Prettier**.
    *   Run `npm run lint` and `npm run check-types` before committing.
*   **Data Fetching**:
    *   Do not use `useEffect` for data fetching. Use `useQuery` or `useMutation` from TanStack Query.

## 3. Configuration & Security

*   **Environment Variables**:
    *   **Backend**: Loaded via `python-dotenv`.
    *   **Frontend**: Accessed via `import.meta.env`.
    *   **Never** commit `.env` files. Use `.env.example` for templates.
*   **Secrets**:
    *   API Keys (GitHub PAT, Gemini Key) must be loaded from environment variables.
    *   Do not hardcode secrets in source code.

## 4. Automation & Workflows

*   **GitHub Actions**:
    *   CI pipeline must pass for all PRs.
    *   Workflows are located in `.github/workflows/`.
*   **Reciprocity Logic**:
    *   Core logic is "Follow-For-Follow" and "Star-For-Star".
    *   Respect the `whitelist` (database stored).

## 5. Contribution Workflow

1.  **Fork & Branch**: Create a feature branch from `main`.
2.  **Test**: Verified locally with `docker compose up --build`.
3.  **PR**: detailed description + verification steps.

## 6. Deployment

*   **Docker**: The primary shipment vehicle.
*   **Platforms**: Supports Render, Railway, DigitalOcean via `deploy/` scripts.
*   **CI/CD**: Automated builds and pushes to Docker Hub on merge to `main`.

## 7. CI/CD Configuration

The following **Repository Secrets** and **Variables** are required for the `.github/workflows/ci-cd-pipeline.yml` to function correctly. Ensure these are set in your GitHub Repository Settings.

### Repository Secrets
*   `DOCKER_HUB_USERNAME`: Username for Docker Hub.
*   `DOCKER_HUB_TOKEN`: Access token for Docker Hub.
*   `GHCR_TOKEN`: (Optional) GitHub Container Registry token (usually `GITHUB_TOKEN` is sufficient, but specific PAT may be needed).
*   `RENDER_SERVICE_ID`: Service ID for Render deployment.
*   `RENDER_API_KEY`: API Key for Render.
*   `RAILWAY_TOKEN`: Token for Railway deployment.
*   `VERCEL_TOKEN`: Token for Vercel deployment.
*   `VERCEL_ORG_ID`: Vercel Organization ID.
*   `VERCEL_PROJECT_ID`: Vercel Project ID.
*   `NETLIFY_AUTH_TOKEN`: Auth token for Netlify.
*   `NETLIFY_SITE_ID`: Site ID for Netlify.
*   `CLOUDFLARE_API_TOKEN`: API Token for Cloudflare.
*   `CLOUDFLARE_ACCOUNT_ID`: Account ID for Cloudflare.
*   `HEROKU_API_KEY`: API Key for Heroku.
*   `HEROKU_APP_NAME`: App name on Heroku.
*   `HEROKU_EMAIL`: Email for Heroku account.
*   `FIREBASE_TOKEN`: Token for Firebase deployment.

### Configuration Variables (Environment Variables)
These enable/disable specific deployment targets. Set them to `true` to enable.
*   `ENABLE_RENDER_DEPLOY`
*   `ENABLE_RAILWAY_DEPLOY`
*   `ENABLE_VERCEL_DEPLOY`
*   `ENABLE_NETLIFY_DEPLOY`
*   `ENABLE_CLOUDFLARE_DEPLOY`
*   `ENABLE_HEROKU_DEPLOY`
*   `ENABLE_FIREBASE_DEPLOY`
