# Unit Testing Reference

This file contains more detailed guidance, patterns, and edge-cases for unit tests in this repo.

## Quick checklist

- Use descriptive test names that read like user stories or behavior specs.
- One behavior per test: split unrelated assertions into separate tests.
- Avoid `beforeEach`/`afterEach` hooks; prefer inline per-test setup.
- Mock external dependencies at module boundaries (network calls, browser APIs).
- Prefer `vi.useFakeTimers()` only when testing timer-related logic, and always call `vi.useRealTimers()` afterwards.
- Validate formatting and types before running tests: `npm run lint && npx tsc -b .`.

## Example: mocking a fetch

- Use `vi.spyOn(global, 'fetch').mockResolvedValue(...)` or a mocking helper.
- Reset mocks between tests with `vi.resetAllMocks()`.

## How to run the helper script

```bash
# Run a single test file
.github/skills/unit-testing/scripts/run-unit-tests.sh path/to/foo.test.ts

# Run the full check (lints + types + all unit tests)
.github/skills/unit-testing/scripts/run-unit-tests.sh
```

## Edge cases

- Tests that rely on animation frames or requestIdle callbacks may need to be wrapped using `vi.useFakeTimers()` or stubbed in setup.
- Long-running integration-like tests belong in Playwright, not unit tests.
