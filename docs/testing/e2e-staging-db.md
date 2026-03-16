# Playwright E2E Tests Against Staging DB

This guide covers running Playwright tests connected to the **staging Supabase project** in two modes:

| Mode                        | Frontend                 | API                          | Supabase |
| --------------------------- | ------------------------ | ---------------------------- | -------- |
| **Local site + staging DB** | `localhost:5173`         | `localhost:8787`             | staging  |
| **Staging site**            | `staging.bardoshare.com` | `staging.bardoshare.com/api` | staging  |

Both modes use a pre-signed `userSession` cookie (generated once, valid 7 days) stored in `e2e/.auth/google-user.json`. The script fetches real user data from Supabase, mints a JWT signed with `JWT_SECRET`, and writes a Playwright `storageState` file — no OAuth flow required.

---

## Prerequisites

Ensure you have both env files in the project root (gitignored):

- `.env.staging` — staging Supabase keys + JWT secret + wrangler config
- `.env.staging-local` — staging Supabase `VITE_*` vars only (for Vite mode)

### `.env.staging` — required keys

The session-generator script (`create-google-user-session.bun.ts`) reads this file via
`bun --env-file .env.staging` and requires all of the keys below. Get the values from the
Cloudflare dashboard (Workers → staging project → Settings → Variables & Secrets) or from
a teammate.

```env
# ── Supabase ──────────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_PROJECT_REF=<staging project ref>
SUPABASE_SERVICE_KEY=<staging service-role key>   # required: admin DB access

# ── JWT ───────────────────────────────────────────────────────────────────────
# Must match the JWT_SECRET in the staging Cloudflare Worker (wrangler secret).
# The session generator signs the userSession cookie with this secret.
JWT_SECRET=<staging jwt secret>

# ── Wrangler / Cloudflare ─────────────────────────────────────────────────────
CLOUDFLARE_STAGING_PROJECT=<cloudflare pages project name>

# ── Optional overrides ────────────────────────────────────────────────────────
# Email of the primary test account (defaults to test1@bardoshare.com if unset)
# E2E_GOOGLE_USER_EMAIL=test1@bardoshare.com

# Override the client IP embedded in the JWT (auto-detected for remote targets)
# E2E_CLIENT_IP=1.2.3.4

# ── Postgres direct connection (used by scripts, not by session generator) ────
PGHOST=<staging db host>
PGPORT=5432
PGUSER=postgres
PGPASSWORD=<staging db password>
PGDATABASE=postgres
```

> **Where to find `JWT_SECRET`**: in the Cloudflare dashboard under Workers & Pages →
> your staging worker → Settings → Variables and Secrets → `JWT_SECRET`. It must be
> identical to what the deployed API uses, otherwise the minted cookie will be rejected.

### `.env.staging-local` — required keys

Used by Vite in `staging-local` mode so the frontend Realtime client connects to staging Supabase.

```env
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging anon key from .env.staging>
```

Create it if missing (copy `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.staging`).

---

## Mode 1 — Local Site + Staging DB

All traffic goes through your local servers, but both frontend Realtime and API queries
hit the staging Supabase project.

### First time (or after 7 days)

```bash
npm run e2e:create-session:staging-db
```

This reads `.env.staging` for the Supabase admin client and `JWT_SECRET`, and writes
`e2e/.auth/google-user.json` with `ip=127.0.0.1`.

### Start servers

```bash
npm run dev:all:staging
```

Starts:

- Vite frontend in `staging-local` mode → uses staging `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Realtime goes to staging)
- Wrangler API with `wrangler.staging.toml` → all DB queries go to staging Supabase

### Run all tests

```bash
npm run test:e2e:dev
```

### Run a single test file

```bash
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test e2e/specs/song-library.spec.ts --reporter=list
```

### Run a single test file with a single browser

```bash
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list
```

### Run a single test by name

```bash
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list --grep "user can see their library"
```

---

## Mode 2 — Staging Site (staging.bardoshare.com)

All traffic goes to the deployed staging environment. No local servers needed.

### First time (or after 7 days)

```bash
npm run e2e:create-session:staging-url
```

This auto-detects your public outbound IP (via `api.ipify.org`) and embeds it in the JWT — Cloudflare sees this as `cf-connecting-ip`. If you're behind a VPN or your IP changes:

```bash
E2E_CLIENT_IP=1.2.3.4 npm run e2e:create-session:staging-url
```

### Run all tests

```bash
npm run test:e2e:staging
```

### Run a single test file

```bash
PLAYWRIGHT_BASE_URL=https://staging.bardoshare.com npx playwright test e2e/specs/song-library.spec.ts --reporter=list
```

### Run a single test file with a single browser

```bash
PLAYWRIGHT_BASE_URL=https://staging.bardoshare.com npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list
```

### Run a single test by name

```bash
PLAYWRIGHT_BASE_URL=https://staging.bardoshare.com npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list --grep "user can see their library"
```

---

## Available Browsers (`--project`)

| Project name      | Description                                    |
| ----------------- | ---------------------------------------------- |
| `chromium`        | Standard Chrome (default for most tests)       |
| `firefox`         | Firefox                                        |
| `chromium-webgpu` | Chrome with WebGPU enabled (TypeGPU demo only) |

Omit `--project` to run all browser projects.

---

## Using the Session in a Spec

```typescript
import { test, expect } from "@playwright/test";
import { GOOGLE_USER_SESSION_PATH } from "../utils/auth-helpers";

// Apply to all tests in this file
test.use({ storageState: GOOGLE_USER_SESSION_PATH });

test("real user can see their song library", async ({ page }) => {
	await page.goto("/en/song-library");
	await expect(page.getByRole("heading", { name: /song library/i })).toBeVisible();
});
```

The `storageState` injects the pre-signed `userSession` cookie into the browser context
before the first navigation — no `/api/me` mocking needed.

---

## Session Expiry

The JWT embedded in `e2e/.auth/google-user.json` expires after **7 days**. When you see
`401 Not authenticated` errors in tests, regenerate it:

```bash
# For Mode 1 (local site)
npm run e2e:create-session:staging-db

# For Mode 2 (staging site)
npm run e2e:create-session:staging-url
```

The file path stays the same so no spec changes are needed.

---

## Two-User Sharing and Invitation Tests

`e2e/specs/sharing.spec.ts` tests end-to-end sharing and invitation flows between **two real users**. Each test opens two independent browser contexts — a sender/admin context and a recipient context — both backed by real staging-DB sessions.

### Tests covered

| Describe block         | Flows                                                 |
| ---------------------- | ----------------------------------------------------- |
| `P2P Song Share`       | Share a song → accept; Share a song → decline         |
| `P2P Playlist Share`   | Share a playlist → accept; Share a playlist → decline |
| `Community Invitation` | Admin invites to community → accept; → decline        |
| `Event Invitation`     | Admin invites to event → accept; → decline            |

### Setup

**1. Generate both user sessions** (once, valid 7 days):

```bash
npm run e2e:create-session:staging-db            # user 1 → e2e/.auth/google-user.json
npm run e2e:create-session:staging-db:user2      # user 2 → e2e/.auth/google-user-2.json
```

For staging URL (running against staging.bardoshare.com):

```bash
npm run e2e:create-session:staging-url           # user 1
npm run e2e:create-session:staging-url:user2     # user 2
```

**2. Set required environment variables** (add to your shell or `.env.test.local`):

```bash
# username of test user 2 (appears in search results when user 1 searches)
E2E_TEST_USER2_USERNAME=test2username

# slugs of items owned/managed by user 1 in the staging DB
E2E_TEST_SONG_SLUG=my-test-song
E2E_TEST_PLAYLIST_SLUG=my-test-playlist
E2E_TEST_COMMUNITY_SLUG=my-test-community    # user 1 must be admin/owner
E2E_TEST_EVENT_SLUG=my-test-event            # user 1 must be admin
```

**3. User 1 must follow (have in their user library) user 2** so that user 2 appears in the share/invite search dropdown.

### Running the sharing tests

```bash
# All sharing tests, all browsers — Mode 1 (local + staging DB)
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 \
  E2E_TEST_USER2_USERNAME=test2username \
  E2E_TEST_SONG_SLUG=my-test-song \
  npx playwright test e2e/specs/sharing.spec.ts --reporter=list

# Single describe block, chromium only
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 \
  E2E_TEST_USER2_USERNAME=test2username \
  E2E_TEST_SONG_SLUG=my-test-song \
  npx playwright test e2e/specs/sharing.spec.ts --project=chromium --reporter=list \
  --grep "P2P Song Share"

# Against staging site (Mode 2)
PLAYWRIGHT_BASE_URL=https://staging.bardoshare.com \
  E2E_TEST_USER2_USERNAME=test2username \
  E2E_TEST_COMMUNITY_SLUG=my-test-community \
  npx playwright test e2e/specs/sharing.spec.ts --project=chromium --reporter=list \
  --grep "Community Invitation"
```

### How skipping works

Each `describe` block skips itself when:

- Either session file is missing (`e2e/.auth/google-user.json` or `e2e/.auth/google-user-2.json`).
- The relevant slug/username env var is not set.

A clean `npm run test:e2e:dev` (which does not set these env vars) will show the tests as
skipped rather than failing.
