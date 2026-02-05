---
name: playwright-testing
description: Playwright testing workflows, templates, and tips for stable, non-flaky E2E tests in dev and CI environments. Use when writing Playwright specs for critical user flows (auth, navigation, features).
license: MIT
compatibility: Playwright 1.x, Node.js 20+, Chrome/Firefox/Safari browsers
metadata:
  author: bkinsey808
  version: "1.0"
---

# Playwright Testing Skill

**What this skill does**

- Provides an example Playwright spec and guidance for writing resilient Playwright tests that follow the project's conventions.
- Recommends use of route mocking, hydration waits, and stable locators.

**When to use**

- When adding Playwright tests that validate critical user flows (login, dashboard, playback, etc.).
- When crafting mocks for API responses or debugging failing E2E runs.

**Step-by-step**

1. Start the dev servers (`npm run dev:all`) for local test development.
2. Use `authenticateTestUser()` and other helpers from `e2e/utils` when validating authenticated flows.
3. After navigation, call `await page.waitForTimeout(HYDRATION_WAIT_MS)` (the project uses a short hydration wait to let React Compiler hydrate the app).
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

```typescript
// BAD: Works locally, flakes in slow CI
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

- Agent guidance: [.github/agents/Playwright Agent.agent.md](../../agents/Playwright%20Agent.agent.md)
- Playwright documentation: https://playwright.dev/
- Best practices: https://playwright.dev/docs/best-practices
- Locator strategies: https://playwright.dev/docs/locators
