# Playwright Testing Reference

Detailed guidance for writing stable Playwright tests in this repo.

## Environment

- Node 20+ is recommended.
- Playwright must be installed (`npm install -D @playwright/test`) and browsers should be installed via `npx playwright install`.

## Best practices

- Use auth helpers from `e2e/utils` for authenticated flows.
- Prefer role-based queries (`getByRole`) and regex text matches for stability.
- Avoid arbitrary sleeps; prefer `waitFor` / wait for network idle / hydration delay patterns. The repo uses a short hydration wait (e.g. HYDRATION_WAIT_MS) after navigation.
- Mock backend responses using `page.route()` to make tests deterministic where appropriate.

## Running the example

```bash
# Dry-run to validate config and spec presence
.github/skills/playwright-testing/scripts/run-playwright-example.sh --dry-run

# Execute the example (headless)
.github/skills/playwright-testing/scripts/run-playwright-example.sh
```

## Edge cases

- If running Playwright in CI, ensure browsers are installed and CI environment variables (e.g., PLAYWRIGHT_BROWSERS_PATH) are set as needed.
- Run tests locally with `npm run test:e2e:dev` for dev-server mode which starts the local servers automatically.
