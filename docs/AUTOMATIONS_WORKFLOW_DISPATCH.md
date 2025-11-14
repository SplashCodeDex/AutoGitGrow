# Automations via GitHub workflow_dispatch

Why this design
- Safety and auditability: Runs are recorded in GitHub Actions with full logs and permissions isolation.
- Principle of least privilege: Backend only dispatches workflows; execution happens in Actions with repo-scoped token.
- Operational alignment: Reuses existing CI/CD infrastructure and secrets management.

Required scopes
- GITHUB_PAT must include the `workflow` scope (classic tokens expose X-OAuth-Scopes header).
- Repo access appropriate for your workflows.

Security model
- Backend never executes automation logic directly; it only calls workflow_dispatch.
- API can be protected with AUTOMATION_API_KEY and CORS FRONTEND_ORIGIN.
- Per-IP rate limiting protects against accidental or abusive triggers.

Pros
- Auditable, observable, permissioned by GitHub.
- Easy rollback and visibility via Actions UI.

Cons
- Adds latency to start; relies on Actions availability.

Setup steps
1) Create a PAT with workflow scope and set GITHUB_PAT in backend env.
2) Set GITHUB_REPO_OWNER and GITHUB_REPO_NAME.
3) Optionally set AUTOMATION_API_KEY and VITE_AUTOMATION_API_KEY for UI access control.
4) Optionally set FRONTEND_ORIGIN and rate limit vars AUTOMATION_RATE_LIMIT_*.

Notes:
- For local development, the backend auto-loads `.env` and optional `.env.local`.
- In production, set environment variables via your platform (Render/Railway/DO).
