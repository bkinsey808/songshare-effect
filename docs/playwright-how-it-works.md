# How Playwright Works In This Repo

This document explains the Playwright setup in `songshare-effect`: what gets started, which commands to use, how authentication works, and where to look when tests fail.

## High-level model

Playwright in this repo can run in two main modes:

1. Local compiled-preview mode
   - Frontend is built to `dist/`
   - `vite preview` serves the built app on `https://127.0.0.1:5173`
   - local Wrangler API runs on `http://127.0.0.1:8787`
   - Vite preview proxies `/api` to the local API

2. Deployed URL mode
   - Playwright points at a staging or production URL
   - no local preview/API stack is started by the wrapper

The default local flow intentionally uses compiled `dist` instead of the Vite dev server because it is closer to production and avoids dev-server flakiness.

## Main entry points

### Config

- `playwright.config.ts`
  - defines projects (`chromium`, `chromium-webgpu`, `firefox`, `webkit`)
  - sets `baseURL`
  - auto-starts the local compiled-preview stack when `PLAYWRIGHT_BASE_URL` is not already set

### Local runner wrappers

- `scripts/playwright/run-playwright-with-timeout.bun.ts`
  - outer timeout wrapper around the local Playwright run
- `scripts/playwright/playwright-run-and-test.bun.ts`
  - starts the local stack
  - waits for readiness
  - ensures Playwright browsers are installed
  - launches `npx playwright test ...`
- `scripts/playwright/playwright-start-preview.bun.ts`
  - kills stale listeners on `5173` and `8787`
  - builds the frontend with `npm run build:client:staging`
  - starts `vite preview`
  - starts `npm run dev:api:staging`
  - probes both services until ready

### Auth/session helpers

- `e2e/utils/create-google-user-session.bun.ts`
  - mints a signed `userSession` cookie
  - writes Playwright `storageState` JSON into `e2e/.auth/`
- `e2e/utils/auth-helpers.ts`
  - shared session paths and auth helpers used by tests

## Command map

### Everyday local runs

- `npm run test:e2e:dev`
  - local compiled preview + local API
  - good default command for local E2E work

- `npm run test:e2e:dev:once`
  - direct local Playwright wrapper run

### Staging DB runs

- `npm run e2e:create-session:staging-db`
  - creates `e2e/.auth/google-user.json`

- `npm run e2e:create-session:staging-db:user2`
  - creates `e2e/.auth/google-user-2.json`

- `npm run test:e2e:dev:staging-db`
  - local compiled preview + local staging API config + staging Supabase-backed data
  - serial worker setup used for the real-user E2E suite

- `npm run test:e2e:dev:staging-db:file -- <spec> --project=<browser>`
  - best command while debugging a single spec

### Deployed environment runs

- `npm run test:e2e:staging`
  - points Playwright at the deployed staging site

- `npm run test:e2e:prod`
  - points Playwright at production

### Lighthouse

- `npm run test:e2e:lighthouse`
- `npm run test:e2e:lighthouse:local`
- `npm run test:e2e:lighthouse:ci`

## What happens during a local run

For commands like `npm run test:e2e:dev` or `npm run test:e2e:dev:staging-db`:

1. Environment variables are loaded.
2. Session files may be created first for real-user flows.
3. The wrapper clears ports `5173` and `8787`.
4. The frontend is built with `npm run build:client:staging`.
5. `vite preview` serves the built frontend on `https://127.0.0.1:5173`.
6. `npm run dev:api:staging` starts Wrangler on `http://127.0.0.1:8787`.
7. The wrapper probes both services and emits `PLAYWRIGHT_WRAPPER: READY`.
8. `npx playwright test ...` starts.
9. When Playwright exits, the wrapper tears down the preview/API processes.

## Base URL rules

The repo uses `PLAYWRIGHT_BASE_URL` heavily.

- local compiled-preview runs use `https://127.0.0.1:5173`
- deployed runs use the explicit deployed URL you provide
- when Playwright auto-starts the local stack, the config also injects the computed base URL into `process.env["PLAYWRIGHT_BASE_URL"]` so helpers and tests stay aligned

The local preview flow uses HTTPS, so Playwright sets `ignoreHTTPSErrors: true`.

## Browser projects

Defined in `playwright.config.ts`:

- `chromium`
  - primary browser for most debugging
- `chromium-webgpu`
  - only for the TypeGPU/WebGPU spec
- `firefox`
  - slower, slightly more conservative timeouts
- `webkit`
  - catches Safari-style issues

If you omit `--project`, Playwright runs every configured project.

## Test organization

The main Playwright tests live under `e2e/`.

Common patterns:

- `e2e/specs/`
  - feature specs and user-flow specs
- `e2e/specs/sharing/helpers/`
  - two-user share/invitation helpers
- `e2e/specs/tagging/helpers/`
  - realtime tagging helpers
- `e2e/utils/`
  - auth setup, response wait helpers, effect wrappers, console/error tracking

The repo uses several styles of E2E tests:

- anonymous/public page tests
- authenticated single-user tests
- two-user real-session sharing/invitation tests
- realtime cross-user tests
- accessibility checks with `@axe-core/playwright`
- Lighthouse performance audits

## Authentication model in tests

There are two main auth strategies:

1. Mocked/local auth helpers
   - used for lighter tests that do not need real staging users

2. Real signed session cookies
   - used for staging-db and deployed staging runs
   - session files live in:
     - `e2e/.auth/google-user.json`
     - `e2e/.auth/google-user-2.json`

The real-session flow does not drive OAuth in the browser. Instead, the helper script signs a `userSession` cookie and stores it as Playwright `storageState`.

## Why some suites run serially

Several specs use shared real users and shared staging data. Those tests are intentionally configured to avoid parallel collisions.

Examples:

- sharing/invitation tests
- realtime multi-user tagging flows

That is why commands like `test:e2e:dev:staging-db` use `--workers=1`.

## Environment variables

| Variable              | Effect                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `PLAYWRIGHT_BASE_URL` | Overrides the target URL; skips local server startup when set                                    |
| `PLAYWRIGHT_VERBOSE`  | Set to any non-empty value to show `[wrangler:info]` request logs (suppressed by default)        |
| `PLAYWRIGHT_RUN_TIMEOUT` | Seconds before the outer timeout wrapper kills the run (default 180)                          |
| `PLAYWRIGHT_DEV_TIMEOUT` | Milliseconds to wait for the local stack to become ready (default 120000)                     |
| `PLAYWRIGHT_SKIP_BROWSER_INSTALL` | Skip automatic browser installation (useful in offline/CI environments)            |

## Logs and temp files

The local wrapper writes logs to:

- `/tmp/playwright-dev-client.log`
- `/tmp/playwright-dev-api.log`

These are reset on each wrapper run so current failures are easier to read.

Useful runtime signals:

- `PLAYWRIGHT_WRAPPER: READY`
  - preview and API are both reachable
- `NS_ERROR_CONNECTION_REFUSED` or `ERR_CONNECTION_REFUSED`
  - preview/API stack died or never became reachable

## How to debug efficiently

Recommended order:

1. Run one spec, one browser
   - `npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/song-sharing.spec.ts --project=chromium --reporter=list`
2. Fix the narrow failure first
3. Re-run that same spec
4. Broaden to the surrounding suite
5. Re-run the full command only after the focused case is stable

Good things to check when a test fails:

- did the wrapper reach `PLAYWRIGHT_WRAPPER: READY`?
- did the failure happen in Chromium only, or in Firefox/WebKit too?
- was the failure a real assertion, a timeout waiting for a response, or a connection refusal?
- do `/tmp/playwright-dev-client.log` and `/tmp/playwright-dev-api.log` show a server-side error?

## Common failure categories

### Startup failures

Symptoms:

- timeout waiting for local stack
- `ECONNREFUSED`
- browser cannot navigate to `https://127.0.0.1:5173`

Usually means:

- preview did not start
- API did not start
- one of the processes exited early

### Session/auth failures

Symptoms:

- `401 Unauthorized`
- `/api/auth/user/token` failures
- tests that should be authenticated behave like signed-out visitors

Usually means:

- session file expired
- staging secrets are wrong or missing
- auth setup script was not run for the correct mode

### Realtime timing failures

Symptoms:

- accept/decline buttons never appear
- viewer page never reflects owner edits
- response waiters time out

Usually means:

- the test needs a more deterministic wait/reload pattern
- the suite is stressing shared staging data

## Related docs

- `docs/testing/e2e-staging-db.md`
- `docs/e2e-run-on-macos.md`
- `docs/lighthouse-running.md`
- `e2e/README.md`
- `e2e/README-AUTH.md`
