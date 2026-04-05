# Playwright E2E Tests Against Staging DB

This guide covers running Playwright tests connected to the **staging Supabase project** in two modes:

| Mode                        | Frontend           | API                    | Supabase |
| --------------------------- | ------------------ | ---------------------- | -------- |
| **Local site + staging DB** | `localhost:5173`   | `localhost:8787`       | staging  |
| **Staging site**            | `<staging-domain>` | `<staging-domain>/api` | staging  |

Both modes use a pre-signed `userSession` cookie (generated once, valid 7 days) stored in `e2e/.auth/google-user.json`. The script fetches real user data from Supabase, mints a JWT signed with `SUPABASE_JWT_SECRET`, and writes a Playwright `storageState` file — no OAuth flow required.

---

## Prerequisites

All secrets are stored in the OS keyring under the `songshare-staging` service. See [env-vars-and-secrets.md](/docs/env-vars-and-secrets.md) for the full setup guide.

The required keys (see `config/env-secrets.staging.list` for the complete list) include:

```
VITE_SUPABASE_URL        VITE_SUPABASE_ANON_KEY   SUPABASE_PROJECT_REF
SUPABASE_SERVICE_KEY     SUPABASE_JWT_SECRET       PLAYWRIGHT_BASE_URL
PGHOST  PGPORT  PGUSER  PGPASSWORD  PGDATABASE
```

Store each value with:

```bash
echo -n "value" | keyring set songshare-staging VAR_NAME
```

> **Where to find `SUPABASE_JWT_SECRET`**: in the Cloudflare dashboard under Workers & Pages →
> your staging worker → Settings → Variables and Secrets → `SUPABASE_JWT_SECRET`. It must be
> identical to what the deployed API uses, otherwise the minted cookie will be rejected.

---

## Mode 1 — Local Site + Staging DB

All traffic goes through your local servers, but both frontend Realtime and API queries
hit the staging Supabase project.

### First time (or after 7 days)

```bash
npm run e2e:create-session:staging-db
```

This reads staging secrets from the keyring (`songshare-staging`) and writes
`e2e/.auth/google-user.json` with `ip=127.0.0.1`.

### Run all tests

```bash
npm run test:e2e:dev:staging-db
```

This single command handles everything: refreshes sessions, builds the frontend, starts the
preview server and Wrangler API, then runs Playwright. Do not start servers separately first —
the wrapper kills and re-starts ports 5173 and 8787 itself.

### Run a single test file

```bash
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts
```

### Run a single test file with a single browser

```bash
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts --project=chromium
```

### Run a single test by name

```bash
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts --project=chromium --grep "user can see their library"
```

---

## Mode 2 — Staging Site (<staging-domain>)

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
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test e2e/specs/song-library.spec.ts --reporter=list
```

### Run a single test file with a single browser

```bash
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list
```

### Run a single test by name

```bash
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test e2e/specs/song-library.spec.ts --project=chromium --reporter=list --grep "user can see their library"
```

---

## Available Browsers (`--project`)

| Project name      | Description                                    |
| ----------------- | ---------------------------------------------- |
| `chromium`        | Standard Chrome (default for most tests)       |
| `firefox`         | Firefox                                        |
| `webkit`          | Safari / WebKit                                |
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

The specs under `e2e/specs/sharing/` test end-to-end sharing and invitation flows between **two real users**. Each test opens two independent browser contexts — a sender/admin context and a recipient context — both backed by real staging-DB sessions.

### Tests covered

| Spec file                   | Describe block         | Flows                                                 |
| --------------------------- | ---------------------- | ----------------------------------------------------- |
| `song-sharing.spec.ts`      | `P2P Song Share`       | Share a song → accept; Share a song → decline         |
| `image-sharing.spec.ts`     | `P2P Image Share`      | Share an image → accept; → decline; → accept + remove |
| `playlist-sharing.spec.ts`  | `P2P Playlist Share`   | Share a playlist → accept; Share a playlist → decline |
| `community-sharing.spec.ts` | `Community Invitation` | Admin invites to community → accept; → decline        |
| `event-sharing.spec.ts`     | `Event Invitation`     | Admin invites to event → accept; → decline            |

### Setup

**1. Generate both user sessions** (once, valid 7 days):

```bash
npm run e2e:create-session:staging-db            # user 1 → e2e/.auth/google-user.json
npm run e2e:create-session:staging-db:user2      # user 2 → e2e/.auth/google-user-2.json
```

For staging URL (running against <staging-domain>):

```bash
npm run e2e:create-session:staging-url           # user 1
npm run e2e:create-session:staging-url:user2     # user 2
```

**2. Set required environment variables** in the `songshare-staging` keyring:

```bash
echo -n "test2username"        | keyring set songshare-staging E2E_TEST_USER2_USERNAME
echo -n "my-test-song"         | keyring set songshare-staging E2E_TEST_SONG_SLUG
echo -n "my-test-playlist"     | keyring set songshare-staging E2E_TEST_PLAYLIST_SLUG
echo -n "my-test-community"    | keyring set songshare-staging E2E_TEST_COMMUNITY_SLUG  # user 1 must be admin/owner
echo -n "my-test-event"        | keyring set songshare-staging E2E_TEST_EVENT_SLUG      # user 1 must be admin
```

These are already loaded automatically when running `npm run test:e2e:staging` or any `e2e:create-session:staging-*` command.

**3. User 1 must follow (have in their user library) user 2** so that user 2 appears in the share/invite search dropdown.

### Running the sharing tests

```bash
# All sharing tests — Mode 1 (local + staging DB)
npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/

# Single spec file, chromium only
npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/song-sharing.spec.ts --project=chromium

# Single describe block by name
npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/song-sharing.spec.ts --project=chromium --grep "P2P Song Share"

# Against staging site (Mode 2) — servers already deployed, pass the URL directly
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test \
  e2e/specs/sharing/community-sharing.spec.ts --project=chromium --reporter=list \
  --grep "Community Invitation"
```

### How skipping works

Each `describe` block skips itself when:

- Either session file is missing (`e2e/.auth/google-user.json` or `e2e/.auth/google-user-2.json`).
- The relevant slug/username env var is not set.

A clean `npm run test:e2e:dev` (which does not set these env vars) will show the tests as
skipped rather than failing.
