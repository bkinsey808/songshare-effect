Title: Unit tests blocked by lint & React compiler errors (SongView)

## Summary

While adding `react/src/song/song-form/SongFormFooter.test.tsx` (tests for the song form footer), running the repository validation steps failed due to existing lint and React Compiler errors in other files (not related to the new tests).

## What I added

- `react/src/song/song-form/SongFormFooter.test.tsx`
  - Tests: rendering of primary action buttons, click handlers (save/reset/cancel), update label when editing, hasChanges class toggling, delete confirmation flow (cancel/confirm), and disabled states while submitting.

## Commands run

1. `npm run lint && npx tsc -b . && npm run test:unit -- --coverage` (required by the Unit Test Agent workflow)
   - Result: FAILED at the lint step (many ESLint/TS errors across `react/src/song/song-view/*` and other files)
2. `npm run test:unit -- --coverage --testNamePattern SongFormFooter` (run tests only)
   - Result: 96 suites skipped, 1 failing suite (`react/src/song/song-view/SongView.test.tsx`) due to a ReactCompilerError (see details below), and our `SongFormFooter` tests were skipped by the test runner.

## Key failing items (high level)

- ESLint errors (a lot) in `react/src/song/song-view/SongView.tsx` and `react/src/song/song-view/SongView.test.tsx`:
  - `switch-case-braces`, `no-nested-ternary`, `no-null`, `no-magic-numbers`, `prefer-global-this`, missing explicit return types, and others.
- React Compiler error while building `SongView.tsx`:
  - "Found 2 errors: Compilation Skipped: Existing memoization could not be preserved" (the react compiler plugin refused to transform due to unstable dependencies in useMemo hooks).
- Lint warnings/errors in other existing test files (e.g., `SongView.test.tsx` mocking `react-i18next` without typed factory) flagged by the linter rules.

## Why this blocks adding tests

- The repo's lint and build checks are enforced as part of the validation step; they fail before tests are run.
- The failing `SongView` test triggers a React Compiler error during the transform stage which causes `vitest` to stop with a failing suite.

## Suggested next steps / options

1. Fix the ESLint/type errors in `SongView.tsx` and its tests (preferred):
   - Add braces for switch-case clauses
   - Remove nested ternaries or add parentheses
   - Replace `null` with `undefined` where appropriate
   - Fix React Compiler memoization warnings (ensure dependencies are stable)
   - Add explicit return types in test mock factories

2. Temporarily isolate test runs (not ideal): run `npm run test:unit` without the mandatory lint step to validate the new tests locally (useful for iteration), but this does not address the repo validation failure.

3. If changes to `SongView` are non-trivial or risky, open a PR limited to lint/TS fixes for `SongView` and related tests, then re-run the validation flow.

## Files added

- `react/src/song/song-form/SongFormFooter.test.tsx` (co-located tests)

If you'd like, I can:

- Open a clear issue/PR description (drafted here) for maintainers to review and fix the upstream lint and React Compiler errors.
- Try to run tests in a restricted environment to show the new tests passing once the linter/compiler issues are resolved.

Please advise how you'd like to proceed.
