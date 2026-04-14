# Playwright Best Practices

This document covers the Playwright setup in `songshare-effect`: how tests run, which commands to use, authentication, writing tests, debugging, VS Code integration, and platform notes.

<a id="toc"></a>

## Table of Contents

- [Writing Tests](#writing-tests)
  - [AAA Pattern](#aaa-pattern)
  - [Translation-Aware Tests](#translation-aware-tests)
- [High-Level Model](#high-level-model)
- [Main Entry Points](#main-entry-points)
- [Command Map](#command-map)
- [What Happens During a Local Run](#what-happens-during-a-local-run)
- [Base URL Rules](#base-url-rules)
- [Browser Projects](#browser-projects)
- [Test Organization](#test-organization)
- [Authentication Model](#authentication-model)
- [Why Some Suites Run Serially](#why-some-suites-run-serially)
- [Mock Auth in Tests](#mock-auth-in-tests)
  - [How Mock Auth Works](#how-mock-auth-works)
  - [Basic Authenticated Test](#basic-authenticated-test)
  - [Custom User Data](#custom-user-data)
  - [Signed-Out User](#signed-out-user)
  - [Multiple Users (Mock)](#multiple-users-mock)
  - [Mock Auth API Reference](#mock-auth-api-reference)
  - [Mock Auth Best Practices](#mock-auth-best-practices)
  - [Mock Auth Troubleshooting](#mock-auth-troubleshooting)
  - [Advanced Mock Usage](#advanced-mock-usage)
- [Staging DB Setup](#staging-db-setup)
  - [Prerequisites](#prerequisites)
  - [Mode 1 — Local Site + Staging DB](#mode-1-local-site--staging-db)
  - [Mode 2 — Staging Site](#mode-2-staging-site)
  - [Using the Session in a Spec](#using-the-session-in-a-spec)
  - [Session Expiry](#session-expiry)
  - [Two-User Sharing Tests](#two-user-sharing-tests)
- [VS Code Integration](#vs-code-integration)
- [Environment Variables](#environment-variables)
- [Logs and Temp Files](#logs-and-temp-files)
- [Debugging](#debugging)
- [Common Failure Categories](#common-failure-categories)
- [macOS Notes](#macos-notes)
- [Lighthouse](#lighthouse)
  - [Lighthouse Commands](#lighthouse-commands)
  - [Lighthouse Environment Variables](#lighthouse-environment-variables)
  - [Lighthouse Recommendations](#lighthouse-recommendations)
  - [Lighthouse Troubleshooting](#lighthouse-troubleshooting)
- [CI Browser Caching](#ci-browser-caching)

---

<a id="writing-tests"></a>

## Writing Tests

<a id="aaa-pattern"></a>

### AAA Pattern

Structure every test with three clearly commented phases — **Arrange**, **Act**, **Assert**:

```typescript
test("user can add a song to their library", async ({ page }) => {
  // Arrange
  await authenticateTestUser(page);
  await page.goto("/en/song-library");
  await expect(page.getByRole("heading", { name: /song library/i })).toBeVisible();

  // Act
  await page.getByRole("button", { name: /add song/i }).click();
  await page.getByLabel("Song title").fill("My New Song");
  await page.getByRole("button", { name: /save/i }).click();

  // Assert
  await expect(page.getByText("My New Song")).toBeVisible();
});
```

**Why it matters:**

- Makes test intent clear at a glance — you can tell what state is being set up, what the user does, and what the expected outcome is
- Makes failures easier to diagnose — if the Act step throws, the Arrange wasn't the problem
- Discourages mixing assertions into the middle of interactions

**For multi-step flows**, use inline comments to separate phases within a longer test rather than collapsing everything into a single block:

```typescript
test("sender shares a song and recipient accepts", async ({ browser }) => {
  // Arrange — set up two authenticated contexts
  const senderCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH });
  const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
  const senderPage = await senderCtx.newPage();
  const recipientPage = await recipientCtx.newPage();

  try {
    // Act — sender shares
    await senderPage.goto("/en/song/my-test-song");
    await senderPage.getByRole("button", { name: /share/i }).click();
    await senderPage.getByLabel("Username").fill("user2");
    await senderPage.getByRole("option", { name: "user2" }).click();
    await senderPage.getByRole("button", { name: /send/i }).click();

    // Assert — recipient sees the invitation
    await recipientPage.goto("/en/notifications");
    await expect(recipientPage.getByText(/shared a song with you/i)).toBeVisible();

    // Act — recipient accepts
    await recipientPage.getByRole("button", { name: /accept/i }).click();

    // Assert — song appears in recipient's library
    await recipientPage.goto("/en/song-library");
    await expect(recipientPage.getByText("my-test-song")).toBeVisible();
  } finally {
    await senderCtx.close();
    await recipientCtx.close();
  }
});
```

<a id="translation-aware-tests"></a>

### Translation-Aware Tests

Tests that rely on text content break when translations change. Use semantic data attributes instead.

**Problem:**

```typescript
// ❌ Fragile — breaks when copy changes
await expect(page.getByText("Your account has been successfully deleted.")).toBeVisible();
```

**Solution — `data-testid` for element selection, semantic attributes for state:**

```typescript
// ✅ Robust — doesn't depend on text content
const alert = page.getByTestId("dismissible-alert");
await expect(alert).toBeVisible();
await expect(alert).toHaveAttribute("data-alert-type", "deleteSuccess");
await expect(alert).toHaveAttribute("data-variant", "success");
```

**Component pattern:**

```tsx
<div
  data-testid="dismissible-alert"
  data-alert-type={alertType}
  data-variant={variant}
>
  <strong data-testid="alert-title">{title}</strong>
  <div data-testid="alert-message">{children}</div>
  <button data-testid="alert-dismiss-button" aria-label="Close">×</button>
</div>
```

**Use constants for alert types** (in `e2e/utils/translationHelpers.ts`):

```typescript
export const ALERT_TYPES = {
  DELETE_SUCCESS: "deleteSuccess",
  SIGN_OUT_SUCCESS: "signOutSuccess",
  SIGN_IN_SUCCESS: "signedInSuccess",
} as const;
```

**Guidelines:**

- ✅ Use `data-testid` for element selection
- ✅ Use semantic `data-*` attributes for state verification
- ✅ Test behavior and functionality, not specific text
- ❌ Hard-code translated strings in tests
- ❌ Use CSS class selectors that may change
- ❌ Test translation accuracy (that is a separate concern)

---

<a id="high-level-model"></a>

## High-Level Model

Playwright runs in two main modes:

1. **Local compiled-preview mode**
   - Frontend is built to `dist/`
   - `vite preview` serves the built app on `https://127.0.0.1:5173`
   - Local Wrangler API runs on `http://127.0.0.1:8787`
   - Vite preview proxies `/api` to the local API

2. **Deployed URL mode**
   - Playwright points at a staging or production URL
   - No local preview/API stack is started by the wrapper

The default local flow intentionally uses compiled `dist` instead of the Vite dev server because it is closer to production and avoids dev-server flakiness.

---

<a id="main-entry-points"></a>

## Main Entry Points

**Config**

- `playwright.config.ts` — defines projects (`chromium`, `chromium-webgpu`, `firefox`, `webkit`), sets `baseURL`, auto-starts the local compiled-preview stack when `PLAYWRIGHT_BASE_URL` is not already set

**Local runner wrappers**

- `scripts/playwright/run-playwright-with-timeout.bun.ts` — outer timeout wrapper around the local Playwright run
- `scripts/playwright/playwright-run-and-test.bun.ts` — starts the local stack, waits for readiness, ensures browsers are installed, launches `npx playwright test …`
- `scripts/playwright/playwright-start-preview.bun.ts` — kills stale listeners on `5173` and `8787`, builds the frontend with `npm run build:client:staging`, starts `vite preview` and `npm run dev:api:staging`, probes both until ready

**Auth/session helpers**

- `e2e/utils/create-google-user-session.bun.ts` — mints a signed `userSession` cookie, writes Playwright `storageState` JSON into `e2e/.auth/`
- `e2e/utils/auth-helpers.ts` — shared session paths and auth helpers used by tests

---

<a id="command-map"></a>

## Command Map

**Everyday local runs**

```bash
npm run test:e2e:dev           # local compiled preview + local API (default)
npm run test:e2e:dev:once      # direct local Playwright wrapper run
```

**Staging DB runs**

```bash
npm run e2e:create-session:staging-db            # creates e2e/.auth/google-user.json
npm run e2e:create-session:staging-db:user2      # creates e2e/.auth/google-user-2.json

npm run test:e2e:dev:staging-db                  # local preview + staging Supabase data
npm run test:e2e:dev:staging-db:file -- <spec> --project=<browser>  # best for single-spec debugging
```

**Deployed environment runs**

```bash
npm run test:e2e:staging       # deployed staging site
npm run test:e2e:prod          # production
```

**Lighthouse**

```bash
npm run test:e2e:lighthouse
npm run test:e2e:lighthouse:local
npm run test:e2e:lighthouse:ci
```

---

<a id="what-happens-during-a-local-run"></a>

## What Happens During a Local Run

For commands like `npm run test:e2e:dev` or `npm run test:e2e:dev:staging-db`:

1. Environment variables are loaded.
2. Session files may be created first for real-user flows.
3. The wrapper clears ports `5173` and `8787`.
4. The frontend is built with `npm run build:client:staging`.
5. `vite preview` serves the built frontend on `https://127.0.0.1:5173`.
6. `npm run dev:api:staging` starts Wrangler on `http://127.0.0.1:8787`.
7. The wrapper probes both services and emits `PLAYWRIGHT_WRAPPER: READY`.
8. `npx playwright test …` starts.
9. When Playwright exits, the wrapper tears down the preview/API processes.

---

<a id="base-url-rules"></a>

## Base URL Rules

- Local compiled-preview runs use `https://127.0.0.1:5173`
- Deployed runs use the explicit deployed URL you provide
- When Playwright auto-starts the local stack, the config injects the computed base URL into `process.env["PLAYWRIGHT_BASE_URL"]` so helpers and tests stay aligned

The local preview flow uses HTTPS, so Playwright sets `ignoreHTTPSErrors: true`.

---

<a id="browser-projects"></a>

## Browser Projects

Defined in `playwright.config.ts`:

| Project | Notes |
|---|---|
| `chromium` | Primary browser for most debugging |
| `chromium-webgpu` | Only for the TypeGPU/WebGPU spec |
| `firefox` | Slightly more conservative timeouts |
| `webkit` | Catches Safari-style issues |

If you omit `--project`, Playwright runs every configured project.

---

<a id="test-organization"></a>

## Test Organization

Tests live under `e2e/`:

- `e2e/specs/` — feature specs and user-flow specs
- `e2e/specs/sharing/helpers/` — two-user share/invitation helpers
- `e2e/specs/tagging/helpers/` — realtime tagging helpers
- `e2e/utils/` — auth setup, response wait helpers, effect wrappers, console/error tracking

Test styles used in this repo:

- Anonymous/public page tests
- Authenticated single-user tests
- Two-user real-session sharing/invitation tests
- Realtime cross-user tests
- Accessibility checks with `@axe-core/playwright`
- Lighthouse performance audits

---

<a id="authentication-model"></a>

## Authentication Model

Two main auth strategies:

1. **Mocked/local auth helpers** — for lighter tests that do not need real staging users; intercepts `/api/me` with `page.route()` — see [Mock Auth in Tests](#mock-auth-in-tests)
2. **Real signed session cookies** — for staging-db and deployed staging runs; session files live in `e2e/.auth/google-user.json` and `e2e/.auth/google-user-2.json` — see [Staging DB Setup](#staging-db-setup)

The real-session flow does not drive OAuth in the browser. The helper script signs a `userSession` cookie and stores it as Playwright `storageState`.

---

<a id="why-some-suites-run-serially"></a>

## Why Some Suites Run Serially

Several specs use shared real users and shared staging data and are intentionally configured to avoid parallel collisions — for example, sharing/invitation tests and realtime multi-user tagging flows. That is why commands like `test:e2e:dev:staging-db` use `--workers=1`.

---

<a id="mock-auth-in-tests"></a>

## Mock Auth in Tests

The app uses OAuth with HttpOnly cookies. Instead of going through full OAuth flows in tests (slow, requires test accounts), lighter tests mock the `/api/me` endpoint using `page.route()`.

<a id="how-mock-auth-works"></a>

### How Mock Auth Works

1. The app calls `/api/me` on load to check if a user is signed in
2. If `/api/me` returns 200 with user data → user is signed in
3. If `/api/me` returns 401/204 → user is signed out
4. Tests use `page.route("**/api/me", …)` to intercept and return mock data

<a id="basic-authenticated-test"></a>

### Basic Authenticated Test

```typescript
import { test, expect } from "@playwright/test";
import { authenticateTestUser } from "./utils/auth-helpers";

test("authenticated user can access dashboard", async ({ page }) => {
  // Must come before navigation
  await authenticateTestUser(page);
  await page.goto("/en/dashboard");
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

<a id="custom-user-data"></a>

### Custom User Data

```typescript
import { authenticateTestUser, createTestUser } from "./utils/auth-helpers";

test("user sees their own name", async ({ page }) => {
  const user = createTestUser({ name: "Jane Doe", email: "jane@example.com" });
  await authenticateTestUser(page, user);
  await page.goto("/en/dashboard");
  await expect(page.getByText(/jane doe/i)).toBeVisible();
});
```

<a id="signed-out-user"></a>

### Signed-Out User

```typescript
import { mockSignedOutUser } from "./utils/auth-helpers";

test("signed-out user is redirected from dashboard", async ({ page }) => {
  await mockSignedOutUser(page);
  await page.goto("/en/dashboard");
  expect(page.url()).toMatch(/\/en\/?$/);
});
```

<a id="multiple-users-mock"></a>

### Multiple Users (Mock)

Use separate browser contexts — never share a context between users:

```typescript
test("different users see their own data", async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  try {
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    await authenticateTestUser(page1, createTestUser({ name: "User One" }));
    await authenticateTestUser(page2, createTestUser({ name: "User Two" }));
    await page1.goto("/en/dashboard");
    await page2.goto("/en/dashboard");
    await expect(page1.getByText(/user one/i)).toBeVisible();
    await expect(page2.getByText(/user two/i)).toBeVisible();
  } finally {
    await context1.close();
    await context2.close();
  }
});
```

<a id="mock-auth-api-reference"></a>

### Mock Auth API Reference

**`authenticateTestUser(page, userSession?)`** — mocks `/api/me` to return an authenticated user. Defaults to `DEFAULT_TEST_USER`.

**`mockSignedOutUser(page)`** — mocks `/api/me` to return 401.

**`createTestUser(overrides?)`** — returns a `MockUserSession` with custom properties merged over the defaults.

**`DEFAULT_TEST_USER`:**

```typescript
{
  user: {
    user_id: "test-user-id-12345",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
  }
}
```

<a id="mock-auth-best-practices"></a>

### Mock Auth Best Practices

- **Always call authentication before navigation** — calling it after may cause race conditions
- **Use separate contexts for multiple users** — shared contexts cause conflicts
- **Use descriptive user data** — `createTestUser({ name: "Admin User" })` not `createTestUser({ name: "User" })`
- **Test both authenticated and unauthenticated states** for any protected route

```typescript
test.describe("Dashboard Access", () => {
  test("authenticated user can access", async ({ page }) => {
    await authenticateTestUser(page);
    // ... test authenticated behavior
  });

  test("unauthenticated user is redirected", async ({ page }) => {
    await mockSignedOutUser(page);
    // ... test redirect behavior
  });
});
```

<a id="mock-auth-troubleshooting"></a>

### Mock Auth Troubleshooting

**Test fails with "Not authenticated"** — call `authenticateTestUser(page)` before `page.goto()`.

**User data not showing up** — use web-first assertions; never use `waitForTimeout`:

```typescript
// ✅ Playwright retries until visible or times out
await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 10_000 });

// ❌ Arbitrary sleep — brittle and slow
await page.waitForTimeout(2000);
```

**Route mock not working** — verify the pattern matches: `**/api/me` matches both `http://localhost:8787/api/me` and `https://localhost:5173/api/me`.

<a id="advanced-mock-usage"></a>

### Advanced Mock Usage

Custom mock responses:

```typescript
async function mockExpiredSession(page: Page): Promise<void> {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({
      status: 401,
      headers: { "Set-Cookie": "userSession=; Max-Age=0; Path=/" },
      body: JSON.stringify({ error: "Session expired" }),
    });
  });
}
```

Parameterized auth with `test.describe.each`:

```typescript
test.describe.each([{ authenticated: true }, { authenticated: false }])(
  "Feature with auth=$authenticated",
  ({ authenticated }) => {
    test("behaves correctly", async ({ page }) => {
      if (authenticated) {
        await authenticateTestUser(page);
      } else {
        await mockSignedOutUser(page);
      }
      // ... test behavior
    });
  },
);
```

---

<a id="staging-db-setup"></a>

## Staging DB Setup

Use real signed sessions (instead of mocked `/api/me`) when tests need Realtime subscriptions, actual DB rows, or RLS enforcement.

| Mode | Frontend | API | Supabase |
|---|---|---|---|
| **Local site + staging DB** | `localhost:5173` | `localhost:8787` | staging |
| **Staging site** | `<staging-domain>` | `<staging-domain>/api` | staging |

<a id="prerequisites"></a>

### Prerequisites

All secrets are stored in the OS keyring under the `songshare-staging` service. See [env-vars-and-secrets.md](/docs/devops/env-vars-and-secrets.md) for the full setup guide.

Required keys (see `config/env-secrets.staging.list` for the complete list):

```
VITE_SUPABASE_URL        VITE_SUPABASE_ANON_KEY   SUPABASE_PROJECT_REF
SUPABASE_SERVICE_KEY     SUPABASE_JWT_SECRET       PLAYWRIGHT_BASE_URL
PGHOST  PGPORT  PGUSER  PGPASSWORD  PGDATABASE
```

Store each value with:

```bash
echo -n "value" | keyring set songshare-staging VAR_NAME
```

> **Where to find `SUPABASE_JWT_SECRET`:** Cloudflare dashboard → Workers & Pages → your staging worker → Settings → Variables and Secrets. It must match what the deployed API uses, otherwise the minted cookie will be rejected.

<a id="mode-1-local-site--staging-db"></a>

### Mode 1 — Local Site + Staging DB

All traffic goes through local servers, but frontend Realtime and API queries hit the staging Supabase project.

**First time (or after 7 days):**

```bash
npm run e2e:create-session:staging-db
```

This reads staging secrets from the keyring and writes `e2e/.auth/google-user.json` with `ip=127.0.0.1`.

**Run all tests:**

```bash
npm run test:e2e:dev:staging-db
```

This single command handles everything: refreshes sessions, builds the frontend, starts preview and Wrangler, then runs Playwright. Do not start servers separately — the wrapper kills and restarts ports `5173` and `8787` itself.

**Run a single file or test:**

```bash
# Single file
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts

# Single file, single browser
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts --project=chromium

# Single test by name
npm run test:e2e:dev:staging-db:file -- e2e/specs/song-library.spec.ts --project=chromium --grep "user can see their library"
```

<a id="mode-2-staging-site"></a>

### Mode 2 — Staging Site

All traffic goes to the deployed staging environment. No local servers needed.

**First time (or after 7 days):**

```bash
npm run e2e:create-session:staging-url
```

This auto-detects your public outbound IP and embeds it in the JWT. If you're behind a VPN or your IP changes:

```bash
E2E_CLIENT_IP=1.2.3.4 npm run e2e:create-session:staging-url
```

**Run all tests:**

```bash
npm run test:e2e:staging
```

**Run a single file or test:**

```bash
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test \
  e2e/specs/song-library.spec.ts --project=chromium --reporter=list

# With grep
PLAYWRIGHT_BASE_URL=https://<staging-domain> npx playwright test \
  e2e/specs/song-library.spec.ts --project=chromium --reporter=list \
  --grep "user can see their library"
```

<a id="using-the-session-in-a-spec"></a>

### Using the Session in a Spec

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

The `storageState` injects the pre-signed `userSession` cookie before the first navigation — no `/api/me` mocking needed.

<a id="session-expiry"></a>

### Session Expiry

The JWT expires after **7 days**. When you see `401 Not authenticated` errors, regenerate:

```bash
# Mode 1 (local site)
npm run e2e:create-session:staging-db

# Mode 2 (staging site)
npm run e2e:create-session:staging-url
```

The file path stays the same so no spec changes are needed.

<a id="two-user-sharing-tests"></a>

### Two-User Sharing Tests

Specs under `e2e/specs/sharing/` test sharing and invitation flows between two real users. Each test opens two independent browser contexts backed by real staging-DB sessions.

| Spec file | Describe block | Flows |
|---|---|---|
| `song-sharing.spec.ts` | `P2P Song Share` | Share → accept; Share → decline |
| `image-sharing.spec.ts` | `P2P Image Share` | Share → accept; → decline; → accept + remove |
| `playlist-sharing.spec.ts` | `P2P Playlist Share` | Share → accept; Share → decline |
| `community-sharing.spec.ts` | `Community Invitation` | Admin invites → accept; → decline |
| `event-sharing.spec.ts` | `Event Invitation` | Admin invites → accept; → decline |

**Setup:**

```bash
# 1. Generate both user sessions (once, valid 7 days)
npm run e2e:create-session:staging-db            # user 1 → e2e/.auth/google-user.json
npm run e2e:create-session:staging-db:user2      # user 2 → e2e/.auth/google-user-2.json

# 2. Set required env vars in the keyring
echo -n "test2username"     | keyring set songshare-staging E2E_TEST_USER2_USERNAME
echo -n "my-test-song"      | keyring set songshare-staging E2E_TEST_SONG_SLUG
echo -n "my-test-playlist"  | keyring set songshare-staging E2E_TEST_PLAYLIST_SLUG
echo -n "my-test-community" | keyring set songshare-staging E2E_TEST_COMMUNITY_SLUG
echo -n "my-test-event"     | keyring set songshare-staging E2E_TEST_EVENT_SLUG
```

User 1 must follow (have in their library) user 2 so user 2 appears in the share/invite search dropdown.

**In your spec, use the `browser` fixture and create two contexts:**

```typescript
import { test, expect } from "@playwright/test";
import { GOOGLE_USER_SESSION_PATH, GOOGLE_USER_SESSION_PATH_2 } from "../utils/auth-helpers";

test("sender shares a song and recipient accepts", async ({ browser }) => {
  const senderCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH });
  const recipientCtx = await browser.newContext({ storageState: GOOGLE_USER_SESSION_PATH_2 });
  try {
    const senderPage = await senderCtx.newPage();
    const recipientPage = await recipientCtx.newPage();
    // ... test logic
  } finally {
    await senderCtx.close();
    await recipientCtx.close();
  }
});
```

See `e2e/specs/sharing/` for the full set of tests and the `createTwoUserContexts` helper.

**Running sharing tests:**

```bash
# All sharing tests
npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/

# Single spec, chromium only
npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/song-sharing.spec.ts --project=chromium
```

**How skipping works:** each `describe` block skips itself when either session file is missing or the relevant slug/username env var is not set. A clean `npm run test:e2e:dev` will show these tests as skipped rather than failing.

---

<a id="vs-code-integration"></a>

## VS Code Integration

Playwright's VS Code extension attempts to auto-start the local preview/API stack using the URL in `playwright.config.ts`. The repo uses the compiled preview flow for that auto-start path.

**Option 1 (preferred) — launch VS Code with `PLAYWRIGHT_BASE_URL` already set:**

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 code .
```

With that set, the Test Explorer runs Playwright without trying to auto-start the webserver.

**Option 2 — let the extension auto-start:**

```bash
npm run playwright:install
# Then start tests from the Test Explorer UI
```

**Browser installation errors** — if Playwright reports "Executable doesn't exist":

```bash
npx playwright install

# Or clear a stale cache and reinstall
rm -rf ~/.cache/ms-playwright
npx playwright install
```

---

<a id="environment-variables"></a>

## Environment Variables

| Variable | Effect |
|---|---|
| `PLAYWRIGHT_BASE_URL` | Overrides the target URL; skips local server startup when set |
| `PLAYWRIGHT_VERBOSE` | Set to any non-empty value to show `[wrangler:info]` request logs |
| `PLAYWRIGHT_RUN_TIMEOUT` | Seconds before the outer timeout wrapper kills the run (default 180) |
| `PLAYWRIGHT_DEV_TIMEOUT` | Milliseconds to wait for the local stack to become ready (default 120000) |
| `PLAYWRIGHT_SKIP_BROWSER_INSTALL` | Skip automatic browser installation (useful in offline/CI environments) |

---

<a id="logs-and-temp-files"></a>

## Logs and Temp Files

The local wrapper writes logs to:

- `/tmp/playwright-dev-client.log`
- `/tmp/playwright-dev-api.log`

These are reset on each wrapper run. Useful runtime signals:

- `PLAYWRIGHT_WRAPPER: READY` — preview and API are both reachable
- `NS_ERROR_CONNECTION_REFUSED` or `ERR_CONNECTION_REFUSED` — preview/API stack died or never became reachable

---

<a id="debugging"></a>

## Debugging

Recommended order:

1. Run one spec, one browser:
   ```bash
   npm run test:e2e:dev:staging-db:file -- e2e/specs/sharing/song-sharing.spec.ts --project=chromium --reporter=list
   ```
2. Fix the narrow failure first.
3. Re-run that same spec.
4. Broaden to the surrounding suite.
5. Re-run the full command only after the focused case is stable.

When a test fails, check:

- Did the wrapper reach `PLAYWRIGHT_WRAPPER: READY`?
- Did the failure happen in Chromium only, or in Firefox/WebKit too?
- Was the failure a real assertion, a timeout, or a connection refusal?
- Do `/tmp/playwright-dev-client.log` and `/tmp/playwright-dev-api.log` show a server-side error?

---

<a id="common-failure-categories"></a>

## Common Failure Categories

**Startup failures**

Symptoms: timeout waiting for local stack, `ECONNREFUSED`, browser cannot navigate to `https://127.0.0.1:5173`.

Usually means: preview did not start, API did not start, or one process exited early.

**Session/auth failures**

Symptoms: `401 Unauthorized`, `/api/auth/user/token` failures, authenticated tests behaving like signed-out visitors.

Usually means: session file expired (re-run `e2e:create-session:*`), staging secrets are wrong or missing, or auth setup script was not run for the correct mode.

**Realtime timing failures**

Symptoms: accept/decline buttons never appear, viewer page never reflects owner edits, response waiters time out.

Usually means: the test needs a more deterministic wait/reload pattern, or the suite is stressing shared staging data.

---

<a id="macos-notes"></a>

## macOS Notes

This project previously relied on the `timeout` utility (GNU coreutils, Linux-only). The cross-platform Bun wrapper (`run-playwright-with-timeout.bun.ts`) removes that dependency.

**Preferred — use the repo's cross-platform wrapper (works on macOS as-is):**

```bash
npm run test:e2e:dev
```

**Alternative — install GNU coreutils and use `gtimeout`:**

```bash
brew install coreutils
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 gtimeout 180 bun ./scripts/playwright/playwright-run-and-test.bun.ts --reporter=list --retries=0 --workers=3 --forbid-only --timeout=20000
```

Override the default 180s timeout:

```bash
PLAYWRIGHT_RUN_TIMEOUT=300 npm run test:e2e:dev
```

---

<a id="lighthouse"></a>

## Lighthouse

<a id="lighthouse-commands"></a>

### Lighthouse Commands

```bash
# Run Lighthouse test (Chromium project)
npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium --reporter=list

# Run locally against dev servers
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npm run test:e2e:lighthouse:local

# Run in CI against a preview URL
LIGHTHOUSE_URL=https://your-preview-url npm run test:e2e:lighthouse:ci

# Build dist, preview it, run Lighthouse, save HTML report
npm run test:e2e:lighthouse:dist-run
```

<a id="lighthouse-environment-variables"></a>

### Lighthouse Environment Variables

| Variable | Effect |
|---|---|
| `LIGHTHOUSE_URL` | Run against this URL instead of `PLAYWRIGHT_BASE_URL` |
| `LIGHTHOUSE_DISABLE_LOCAL` | Set to `1` to skip Lighthouse locally |
| `LIGHTHOUSE_MIN_SCORE` | Minimum score threshold (default: 90) |
| `LIGHTHOUSE_MODE` | `dev`, `dist`, or `ci` — selects preset thresholds |
| `LIGHTHOUSE_MIN_SCORE_DEV` | Threshold for local/dev runs (default: 50) |
| `LIGHTHOUSE_MIN_SCORE_DIST` | Threshold for production/preview runs (default: 90) |
| `LH_OUTPUT_DIR` | When set, writes `lighthouse-<timestamp>.html` to this directory |

<a id="lighthouse-recommendations"></a>

### Lighthouse Recommendations

- For deterministic CI runs, run Lighthouse against an HTTP preview or a site with a trusted certificate (use `LIGHTHOUSE_URL`).
- Local dev environments (self-signed certs, WSL2 quirks, missing system libs) can cause flakiness; the test has built-in retries and will skip gracefully if Chrome does not accept connections.
- If you need an always-on local run, use an HTTP preview rather than HTTPS with self-signed certs.
- Local runs may produce lower scores than CI — relax the threshold with `LIGHTHOUSE_MIN_SCORE=50`.

<a id="lighthouse-troubleshooting"></a>

### Lighthouse Troubleshooting

Install optional dev dependencies if you want Lighthouse during development:

```bash
npm i -D lighthouse chrome-launcher
```

Ensure a Chrome/Chromium binary is available to `chrome-launcher`:

```bash
# Debian/Ubuntu system Chromium
sudo apt install -y chromium

# Or use Playwright's managed Chromium binary
node -e "console.log(require('playwright').chromium.executablePath())"
CHROME_PATH=/path/to/chrome CHROME_BIN=/path/to/chrome \
  LIGHTHOUSE_URL=http://localhost:5173 \
  npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium
```

If the test is skipped, check the output:

- `"lighthouse or chrome-launcher not installed"` → install the dev deps above
- `"Certificate interstitial blocked Lighthouse"` → use HTTP or a trusted cert, or set `LIGHTHOUSE_URL=http://...`

---

<a id="ci-browser-caching"></a>

## CI Browser Caching

Browsers are large — caching them in CI significantly reduces runtime. Two approaches for GitHub Actions:

**Option 1 — Cache the default Playwright cache directory:**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
    restore-keys: ${{ runner.os }}-playwright-
```

**Option 2 — Use a repo-local cache (portable across OSes):**

```yaml
# top-level job env
env:
  PLAYWRIGHT_BROWSERS_PATH: ${{ github.workspace }}/.playwright-browsers

steps:
  - name: Cache repo-local Playwright browsers
    uses: actions/cache@v4
    with:
      path: .playwright-browsers
      key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
      restore-keys: ${{ runner.os }}-playwright-
```

Then run `npm run playwright:install` — it will fast-path using the cache. Use the lockfile hash in the cache key to automatically invalidate when dependencies change.
