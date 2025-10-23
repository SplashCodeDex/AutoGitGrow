# Project Improvement Plan

This document outlines the planned enhancements and fixes for the AutoGitGrow project, based on a comprehensive analysis. Each item will be addressed systematically, with commits after each completed concept.

## Phase 1: Docker Compose Refinements (Robustness & Consistency)

-   [x] **Refine `worker` service command:**
    -   Create `scripts/start_workers.sh` to orchestrate Python scripts.
    -   Update `docker-compose.yml` to use `start_workers.sh` in the `worker` service.
    -   *(Consider later: Implement `supervisord` in `worker` service for more robust process management)*
-   [x] **Externalize Docker Compose environment variables:**
    -   Update `docker-compose.yml` to use a `.env` file for sensitive credentials (DB user, password, etc.).
    -   Update `backend/Dockerfile` and `Dockerfile` (frontend) to use build arguments or environment variables from `.env`.
-   [x] **Correct `VITE_API_URL` in `frontend` service:**
    -   Change `VITE_API_URL` to `http://backend:8000` for inter-container communication.
-   [x] **Implement Database Migrations in Docker Compose:**
    -   Determine the database migration tool (e.g., Alembic).
    -   Add a step to the `backend` service (or a new `init-db` service) to run migrations before the application starts.
-   [x] **Review `worker` service dependencies:**
    -   If Python scripts interact with the backend API, add `depends_on: - backend` to the `worker` service.

## Phase 2: Frontend Enhancements (Layout & Data Handling)

-   [x] **Evaluate `3d-card` component usage:**
    -   Assess if the complexity of `src/components/ui/3d-card.tsx` is justified for `StatCard`s.
    -   *(Consider later: Refactor `StatCard` to use a simpler `div`-based card if `3d-card` is overkill and hinders layout control.)*
-   [x] **Centralize API endpoint definitions:**
    -   Create a dedicated file (e.g., `src/lib/api.ts`) for API endpoint constants.
    -   Update `Dashboard.tsx` to use these centralized definitions.
-   [x] **Improve Frontend Data Fetching Error Handling:**
    -   Implement a more robust data fetching strategy (e.g., using `react-query` or `swr` if not already present, or enhancing existing `useEffect` error handling).
    -   Provide better user feedback for API errors.
-   [x] **Address `isDarkMode` prop drilling:**
    -   Utilize React Context or Jotai (already in dependencies) to provide `isDarkMode` globally.
    -   Refactor components to consume `isDarkMode` from context/store.

## Phase 3: Backend & Script Robustness

-   [x] **Implement robust logging for Python scripts:**
    -   Add structured logging (using Python's `logging` module) to all scripts in `scripts/`.
    -   Configure log levels and output destinations.
-   [x] **Enhance error handling and retry mechanisms in Python scripts:**
    -   Add `try-except` blocks for critical operations.
    -   Implement retry logic for network requests (e.g., GitHub API calls).
-   [x] **Verify ORM usage in Python scripts:**
    -   Confirm that scripts interact with the database via the ORM defined in `backend/models.py` to maintain consistency and security.
-   [x] **Centralize script configurations:**
    -   Ensure all script configurations (e.g., GitHub tokens, user lists) are managed via environment variables or a dedicated config file (e.g., `config/`).

## Phase 4: General Enhancements & Code Quality

-   [x] **Verify `motion` dependency usage:**
    -   `framer-motion` is extensively used across several frontend components for animations and UI effects, therefore it is not redundant and should not be removed.
-   [x] **Enhance GitHub Actions:**
    -   Expanded existing workflows to build Docker images, run tests (with placeholders), and push to a container registry.
-   [x] **Implement comprehensive testing:**
    -   **Backend Testing (Python):**
        -   [x] **Unit Tests:** `crud.py` (`get_user_by_username`, `create_user` implemented), `main.py` (API endpoints with mocked DB implemented).
        -   [x] **Integration Tests:** `main.py` and `crud.py` interaction with real/in-memory DB implemented.
        -   **Tools:** `pytest`, `httpx`.
    -   **Frontend Testing (React/TypeScript):**
        -   **Unit Tests:** Individual components (rendering, props, isolated logic), utility functions.
        -   **Integration Tests:** Component interactions, data fetching/display from backend.
        -   **End-to-End (E2E) Tests:** User flows (navigation, UI interaction, data verification) using `Cypress` or `Playwright`.
        -   **Tools:** `Jest`, `React Testing Library`, `Cypress`/`Playwright`.
-   [x] **Container Optimization:**
    -   Refactored `backend/Dockerfile` for multi-stage builds and added `HEALTHCHECK`.
    -   Refactored root `Dockerfile` (frontend) for multi-stage builds, production serving with Nginx, and added `HEALTHCHECK`.
    -   Updated `docker-compose.yml` to remove development volumes, update frontend port, make `VITE_API_URL` configurable, and adjust scheduler logging.
-   [x] **Update Documentation:**
    -   Updated `README.md` to reflect Dockerfile, `docker-compose.yml`, and CI/CD changes, emphasizing Docker installation, local development, deployment considerations, and GitHub Actions with required secrets.