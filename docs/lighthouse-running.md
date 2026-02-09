# Lighthouse E2E: running locally and in CI ⚡️

This document explains how to run the Lighthouse E2E audit and recommended settings for reliable local and CI runs.

## Quick commands

- Run Lighthouse test (Chromium project):

  npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium --reporter=list

- Run locally against dev servers (default dev base URL):

  PLAYWRIGHT_BASE_URL=https://127.0.0.1:5173 npm run test:e2e:lighthouse:local

- Run in CI against a preview URL:

  LIGHTHOUSE_URL=https://your-preview-url npm run test:e2e:lighthouse:ci

- Quick helper: build, preview `dist`, run Lighthouse and save HTML report:

  npm run test:e2e:lighthouse:dist-run

## Environment variables

- LIGHTHOUSE_URL — optional. If set, tests will run Lighthouse against this URL instead of local PLAYWRIGHT_BASE_URL.
- LIGHTHOUSE_DISABLE_LOCAL — set to `1` to skip Lighthouse locally (convenient during fast local iterations).
- LIGHTHOUSE_MIN_SCORE — override the minimum score threshold for the audit (default: 90).
- LIGHTHOUSE_MODE — optional: set to `dev`, `dist`, or `ci` to select preset thresholds or bypass auto-detection.
- LIGHTHOUSE_MIN_SCORE_DEV — optional: override the threshold used when running against a local/dev server (default: 50).
- LIGHTHOUSE_MIN_SCORE_DIST — optional: override the threshold used when running against a production/preview URL (default: 90).
- LH_OUTPUT_DIR — when set, the test will write an HTML Lighthouse report into this directory.

## Recommendations

- For deterministic CI runs, run Lighthouse in a dedicated job against either an HTTP preview or a site available under a trusted certificate (use `LIGHTHOUSE_URL`).
- Local dev environments (self-signed certs, WSL2 path quirks, missing system libs) can cause flakiness; the test has built-in retries and will skip gracefully if Chrome does not accept connections.
- If you need an always-on local run, consider spinning up an HTTP preview rather than HTTPS with self-signed certs.

## Output

If `LH_OUTPUT_DIR` is set, the test writes `lighthouse-<timestamp>.html` to that directory for inspection.

## Troubleshooting (local)

- Install the optional dev dependencies locally if you want to run Lighthouse during development:

  ```bash
  npm i -D lighthouse chrome-launcher
  ```

- Ensure a Chrome/Chromium binary is available to `chrome-launcher`:
  - Install system Chromium (e.g., Debian/Ubuntu):

    ```bash
    sudo apt install -y chromium
    ```

  - Or point the test at Playwright's managed Chromium binary (useful if you don't want a system install):

    ```bash
    node -e "console.log(require('playwright').chromium.executablePath())"

    CHROME_PATH=/path/to/chrome CHROME_BIN=/path/to/chrome LIGHTHOUSE_URL=http://localhost:5173 \
      npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium
    ```

  - Note: the full path must point to the executable (on Linux this usually includes `chrome-linux64/chrome`).

- If the test is skipped, check the output for these messages and act accordingly:
  - "lighthouse or chrome-launcher not installed" → install the dev deps above.
  - "Certificate interstitial blocked Lighthouse" → use HTTP or a trusted cert or set `LIGHTHOUSE_URL` to `http://...`.

- Local runs may produce lower performance scores than CI (your machine may be slower):
  - To test locally with relaxed thresholds, set `LIGHTHOUSE_MIN_SCORE` for the run, e.g.:

    ```bash
    LIGHTHOUSE_MIN_SCORE=50 npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium
    ```

- To generate an HTML report for inspection set `LH_OUTPUT_DIR` before running.

---
If you want, I can also add a GitHub Actions job that runs Lighthouse against a preview URL and uploads the HTML report as an artifact. Would you like that? (yes/no)