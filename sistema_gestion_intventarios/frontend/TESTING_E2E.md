Playwright E2E - Setup and run instructions

This document describes how to run the Playwright E2E tests for the `frontend` app and the E2E Keycloak mock mode.

Prerequisites
- Node 18+ and npm

Install browsers and dependencies
```powershell
cd frontend
npm ci
npx playwright install --with-deps
```

Run the app (in one terminal)
```powershell
# Development (recommended for debug)
npm run dev

# Or build+start for production-like behavior
npm run build
npm run start
```

Run tests (in another terminal)
```powershell
# Enable E2E mock mode so tests use the local keycloak mock
$env:NEXT_PUBLIC_E2E='true'
# Optionally set BASE_URL if not localhost:3000
$env:BASE_URL='http://localhost:3000'

npx playwright test
```

Notes
- The repository includes a lightweight Keycloak mock gated by `NEXT_PUBLIC_E2E=true`. This avoids real SSO redirects and makes tests deterministic.
- The tests expect the app to be served at `BASE_URL` (defaults to `http://localhost:3000`).
- Artifacts (traces, videos, screenshots) are saved under `tests/e2e` and `tests/e2e/playwright-report`.
