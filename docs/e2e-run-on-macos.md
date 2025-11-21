# Running Playwright e2e tests on macOS

This project previously relied on the `timeout` utility which is available in GNU coreutils (Linux) but not installed by default on macOS.

Two recommended approaches to run `npm run test:e2e:dev` on macOS:

1. Preferred — use the repository's cross-platform wrapper

- We include `scripts/run-playwright-with-timeout.bun.ts` which will spawn the `bun` Playwright runner and ensure a timeout is enforced across platforms.
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
PLAYWRIGHT_BASE_URL=https://localhost:5173 gtimeout 180 bun ./scripts/playwright-run-and-test.bun.ts --reporter=list --retries=0 --workers=3 --forbid-only --timeout=20000
```

Notes:

- If you already had `timeout` via another utility or custom link, you can continue using it — the wrapper just makes the repository portable.
- The wrapper script also accepts a `PLAYWRIGHT_RUN_TIMEOUT` environment variable to override the default (180s):

```bash
PLAYWRIGHT_RUN_TIMEOUT=300 PLAYWRIGHT_BASE_URL=https://localhost:5173 npm run test:e2e:dev
```
