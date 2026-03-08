---
name: playwright-testing
description: Playwright testing workflows, templates, and tips for stable, non-flaky E2E tests in dev and CI environments. Use when writing Playwright specs for critical user flows (auth, navigation, features).
compatibility: Playwright 1.x, Node.js 20+, Chrome/Firefox/Safari browsers
metadata:
  author: bkinsey808
  version: "1.0"
---

# Playwright Testing Skill

## Use When

Use this skill when:

- Adding or updating Playwright specs under `e2e/`.
- Debugging flaky end-to-end tests or stabilizing CI/browser behavior.

Execution workflow:

1. Use project helpers and stable role-based locators first.
2. Mock network boundaries intentionally and keep waits deterministic.
3. Run the narrowest spec while iterating, then broaden test coverage.
4. Validate with `npm run test:e2e:dev` (or targeted Playwright command) before finalizing.

Output requirements:

- Report scenarios covered and any new mocks or helpers introduced.
- Report exact Playwright command(s) run.

**What this skill does**

- Provides an example Playwright spec and guidance for writing resilient Playwright tests that follow the project's conventions.
- Recommends use of route mocking, hydration waits, and stable locators.

**When to use**

- When adding Playwright tests that validate critical user flows (login, dashboard, playback, etc.).
- When crafting mocks for API responses or debugging failing E2E runs.

**Step-by-step**

1. Start the dev servers (`npm run dev:all`) for local test development.
2. Use `authenticateTestUser()` and other helpers from `e2e/utils` when validating authenticated flows.
3. After navigation, call `await page.waitForTimeout(HYDRATION_WAIT_MS)` where `HYDRATION_WAIT_MS` is a named constant from `e2e/utils`. This deliberate hydration wait is the one acceptable use of `waitForTimeout` — it uses a shared constant, not a magic number, and accounts for React Compiler hydration time.
4. Prefer role-based locators (e.g., `getByRole`) and regex text matches for stability.
5. Use `npm run test:e2e:dev` for running tests in dev mode and `npx playwright test` for CI or production checks.

## Examples

- See [example.spec.ts](./example.spec.ts) for a templated test showing auth, navigation, and assertions.

## Common Pitfalls

### ❌ Over-specific locators (brittle selectors)

```typescript
// BAD: Too specific, breaks if CSS changes
await page.locator("body > div.container > section > button.submit-btn").click();
```

**✅ Better:** Use semantic locators:

```typescript
// GOOD: Accessible and stable
await page.getByRole("button", { name: /submit/i }).click();
```

### ❌ Hard-coded timeouts (flaky in CI)

**Exception:** `HYDRATION_WAIT_MS` from `e2e/utils` is permitted — it's a project constant for React hydration, not a magic number.

```typescript
// BAD: Magic number timeout — flaky in CI
await page.waitForTimeout(500);
await page.click("button");
```

**✅ Better:** Wait for element to be ready:

```typescript
// GOOD: Waits up to 30s for button to be enabled
await page.getByRole("button", { name: /submit/i }).isEnabled();
await page.getByRole("button", { name: /submit/i }).click();
```

## Validation Commands

Run these to validate Playwright tests:

```bash
# Run tests in dev mode (slow, interactive)
npm run test:e2e:dev

# Run tests in CI mode (fast, headless)
npx playwright test

# Run a single test file
npx playwright test e2e/specs/auth.spec.ts

# Run tests matching a pattern
npx playwright test -g "login"

# Debug a test
npx playwright test --debug e2e/specs/auth.spec.ts

# View test report
npx playwright show-report
```

## References

- Playwright documentation: https://playwright.dev/
- Best practices: https://playwright.dev/docs/best-practices
- Locator strategies: https://playwright.dev/docs/locators

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If you need unit-level coverage in addition to E2E, also load `unit-testing`.
- If E2E failures involve auth behavior, also load `authentication-system`.
