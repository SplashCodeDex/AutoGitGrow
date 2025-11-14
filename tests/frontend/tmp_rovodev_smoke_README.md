Frontend smoke test plan (to implement):
- Use a lightweight test runner (e.g., Vitest) to render AutomationsPanel with mocked fetch.
- Mock GET /api/automation/runs to return a success last run.
- Verify the badge color renders as green and timestamp is displayed.
- Mock POST /api/automation/run and verify headers include X-Automation-Key when VITE_AUTOMATION_API_KEY is set.

Note: The project currently lacks a test runner setup for the frontend. Recommend adding Vitest + @testing-library/react for this.
