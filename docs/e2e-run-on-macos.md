# Running Playwright e2e tests on macOS

This project previously relied on the `timeout` utility which is available in GNU coreutils (Linux) but not installed by default on macOS.

Two recommended approaches to run `npm run test:e2e:dev` on macOS.

`npm run test:e2e:dev` now builds the compiled frontend, serves it with `vite preview`,
and starts the local API separately. This is intentionally more stable than running
Playwright against the front-end dev server.

1. Preferred — use the repository's cross-platform wrapper

- We include `scripts/playwright/run-playwright-with-timeout.bun.ts` which will spawn the `bun` Playwright runner and ensure a timeout is enforced across platforms.
- Example:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:e2e:dev
```

2. Alternative — install GNU coreutils and use `gtimeout`

- If you prefer to use the `timeout` command like on Linux, install GNU coreutils:

```bash
brew install coreutils
```

- This will provide `gtimeout` which acts like `timeout`:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 gtimeout 180 bun ./scripts/playwright/playwright-run-and-test.bun.ts --reporter=list --retries=0 --workers=3 --forbid-only --timeout=20000
```

Notes:

- If you already had `timeout` via another utility or custom link, you can continue using it — the wrapper just makes the repository portable.
- The wrapper script also accepts a `PLAYWRIGHT_RUN_TIMEOUT` environment variable to override the default (180s):

```bash
PLAYWRIGHT_RUN_TIMEOUT=300 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:e2e:dev
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

Playwright's VS Code integration runs the test runner directly and, by default,
attempts to start the local preview/API stack itself using the URL configured in
`playwright.config.ts`. The repository now prefers the compiled preview flow for
that auto-start path because it is more reliable than the Vite dev server.

Two practical ways to run tests successfully from the VS Code Test Explorer:

- Start your dev servers first and tell the Test Explorer where the running app
  is by making sure the `PLAYWRIGHT_BASE_URL` environment variable is available
  to the VS Code process. The simplest way to do that is to launch VS Code from a
  terminal with the variable set, for example:

```bash
# Start VS Code with the environment variable inherited by the extension
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 code .
```

    With that set (and your local preview/API stack already running),
    the Test Explorer will run Playwright tests and won't try to auto-start the
    webserver.

- Or, install the Node Playwright browsers and allow the extension to auto-start
  the local preview/API stack:

```bash
npm run playwright:install
# then start tests from the Test Explorer UI (the extension will attempt to
# build the client, start preview, and start the local API)
```

The first option, launching VS Code with `PLAYWRIGHT_BASE_URL` and running the
stack yourself, tends to be the most reliable on developer machines.

## Auto-start behavior

To make Playwright's Test Explorer auto-start more reliable, the repository
now auto-starts a compiled preview server and the local API instead of the
front-end dev server. The Test Runner uses an HTTP base URL in that scenario
so the browser navigation matches the launched server and avoids TLS probe
failures from self-signed local certificates.

Before using the Test Explorer auto-start flow, ensure Playwright's Node
browsers are installed in your project:

```bash
npm run playwright:install
```

After installing browsers, you can run tests inside VS Code's test explorer and
the Playwright extension will auto-start the preview/API stack reliably. This
change only affects the Playwright auto-start path; your normal manual
`npm run dev:all` workflow still uses the existing dev-server experience.

This is especially useful on CI workers where a cached directory may exist but not contain browser binaries.
