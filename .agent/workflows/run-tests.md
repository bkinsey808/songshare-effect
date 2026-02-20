---
description: Run unit and end-to-end tests
---

// turbo-all

# Run Tests

This workflow covers running unit tests (Vitest) and end-to-end tests (Playwright).

## Unit Tests (Vitest)

// turbo

1. Run all unit tests:

```bash
npm run test:unit
```

Unit tests are `.test.ts` or `.test.tsx` files colocated with the source files.

## End-to-End Tests (Playwright)

### Development Environment (localhost)

// turbo 2. Run E2E tests against local development servers:

```bash
npm run test:e2e:dev
```

This runs tests against `https://127.0.0.1:5173` with:

- List reporter
- 0 retries
- 3 workers
- 20s timeout

### One-Time E2E Test (with server startup)

3. Run E2E tests with automatic server startup and shutdown:

```bash
npm run test:e2e:dev:once
```

### Production Environment

4. Run E2E tests against production:

```bash
npm run test:e2e:prod
```

This runs tests against `https://effect.bardoshare.com`.

## Playwright Installation

If Playwright browsers are not installed:

```bash
npm run playwright:install
```
