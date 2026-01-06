# Running Playwright e2e tests on macOS

This project previously relied on the `timeout` utility which is available in GNU coreutils (Linux) but not installed by default on macOS.

Two recommended approaches to run `npm run test:e2e:dev` on macOS:

1. Preferred — use the repository's cross-platform wrapper

- We include `scripts/playwright/run-playwright-with-timeout.bun.ts` which will spawn the `bun` Playwright runner and ensure a timeout is enforced across platforms.
- Example:

```bash
PLAYWRIGHT_BASE_URL=https://localhost:5173 npm run test:e2e:dev
```

2. Alternative — install GNU coreutils and use `gtimeout`

- If you prefer to use the `timeout` command like on Linux, install GNU coreutils:

```bash
brew install coreutils
```

- This will provide `gtimeout` which acts like `timeout`:

```bash
PLAYWRIGHT_BASE_URL=https://localhost:5173 gtimeout 180 bun ./scripts/playwright/playwright-run-and-test.bun.ts --reporter=list --retries=0 --workers=3 --forbid-only --timeout=20000
```

Notes:

- If you already had `timeout` via another utility or custom link, you can continue using it — the wrapper just makes the repository portable.
- The wrapper script also accepts a `PLAYWRIGHT_RUN_TIMEOUT` environment variable to override the default (180s):

```bash
PLAYWRIGHT_RUN_TIMEOUT=300 PLAYWRIGHT_BASE_URL=https://localhost:5173 npm run test:e2e:dev
```

## Troubleshooting browser failures

If Playwright reports errors like "Executable doesn't exist" or suggests running `npx playwright install`, it's usually because the local Playwright browser cache is empty or incomplete. The runner will now attempt to detect real browser executables and run `npx playwright install` automatically when missing, but you can manually fix the problem by:

```bash
# Force-download browsers
npx playwright install

# Or remove any stale cache and reinstall
rm -rf ~/.cache/ms-playwright
npx playwright install
```

## Running tests inside VS Code (Test Explorer)

Playwright's VS Code integration runs the test runner directly and (by default)
attempts to start the dev servers itself using the url configured in
`playwright.config.ts`. In this repo the dev server is usually served over
HTTPS with a locally-generated certificate which can cause Playwright's
readiness check to fail when it tries to probe the URL from Node (self-signed
certs are rejected).

Two practical ways to run tests successfully from the VS Code Test Explorer:

- Start your dev servers first and tell the Test Explorer where the running app
  is by making sure the `PLAYWRIGHT_BASE_URL` environment variable is available
  to the VS Code process. The simplest way to do that is to launch VS Code from a
  terminal with the variable set, for example:

```bash
# Start VS Code with the environment variable inherited by the extension
PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 code .
```

    With that set (and your dev servers already running via `npm run dev:all`),
    the Test Explorer will run Playwright tests and won't try to auto-start the
    webserver.

- Or, install the Node Playwright browsers and allow the extension to auto-start
  the dev servers (this is more fragile when the dev server uses a self-signed
  cert):

```bash
npm run playwright:install
# then start tests from the Test Explorer UI (the extension will attempt to
# start `npm run dev:all` and wait for the server to become available)
```

The first option (launching VS Code with PLAYWRIGHT_BASE_URL and running the
servers yourself) tends to be the most reliable on developer machines.

## Auto-start behavior (improved)

To make Playwright's Test Explorer auto-start more reliable, the repository
now runs the front-end dev server over HTTP when Playwright auto-starts the
dev servers. This avoids TLS probe failures against self-signed certificates
which previously caused readiness timeouts. The Test Runner will use an HTTP
base URL in that scenario so the browser navigation matches the launched server.

Before using the Test Explorer auto-start flow, ensure Playwright's Node
browsers are installed in your project:

```bash
npm run playwright:install
```

After installing browsers, you can run tests inside VS Code's test explorer and
the Playwright extension will auto-start the dev servers reliably (the
repository temporarily disables HTTPS for the started server so node probes
succeed). This change only affects the automatically-started server — your
manual `npm run dev:all` still uses the normal HTTPS dev experience when
mkcert certs are present.

This is especially useful on CI workers where a cached directory may exist but not contain browser binaries.
