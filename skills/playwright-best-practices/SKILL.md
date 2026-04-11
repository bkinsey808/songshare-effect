---
name: playwright-best-practices
description: >
  Playwright E2E test conventions for this project — AAA pattern, translation-aware
  selectors, mock auth, staging DB sessions, two-user flows, debugging, and CI setup.
  Use when authoring or editing any Playwright spec, test helper, or E2E configuration.
  Do NOT use for unit tests or hook tests — load unit-test-best-practices instead.
---

**Requires:** file-read, terminal. No network access needed.

**Full reference:** [/docs/testing/playwright-best-practices.md](/docs/testing/playwright-best-practices.md)

## Preconditions

- Read the spec file before editing.
- Check `docs/ai/rules.md` for repo-wide constraints.

## Defaults (proceed without asking)

- Apply all key rules below; edit the file already open or mentioned.
- **Always ask:** which spec file if not specified and cannot be inferred.

## Key rules

- **AAA pattern** — every test must have `// Arrange`, `// Act`, `// Assert` comments. For multi-step flows, use inline phase comments rather than collapsing everything.
  [→ full detail](/docs/testing/playwright-best-practices.md#aaa-pattern)

- **Translation-aware selectors** — use `data-testid` and semantic `data-*` attributes; never assert on translated text strings.
  [→ full detail](/docs/testing/playwright-best-practices.md#translation-aware-tests)

- **Mock auth before navigation** — call `authenticateTestUser(page)` before `page.goto()`; never after.
  [→ full detail](/docs/testing/playwright-best-practices.md#mock-auth-in-tests)

- **Separate contexts for multiple users** — use `browser.newContext()` per user; never share a context.
  [→ full detail](/docs/testing/playwright-best-practices.md#multiple-users-mock)

- **Web-first assertions** — use `await expect(...).toBeVisible()` with a timeout; never `waitForTimeout`.
  [→ full detail](/docs/testing/playwright-best-practices.md#mock-auth-troubleshooting)

- **Real sessions for Realtime/RLS tests** — use `storageState` with pre-signed cookies instead of mocking `/api/me` when tests need actual DB rows or Supabase Realtime.
  [→ full detail](/docs/testing/playwright-best-practices.md#staging-db-setup)

- **Session expiry** — JWT expires after 7 days; re-run the matching `e2e:create-session:*` command when you see `401 Not authenticated`.
  [→ full detail](/docs/testing/playwright-best-practices.md#session-expiry)

- **Single-spec debugging** — use `test:e2e:dev:staging-db:file -- <spec> --project=chromium` to isolate failures before broadening.
  [→ full detail](/docs/testing/playwright-best-practices.md#debugging)

## Output format

Write code changes directly. After edits, output a brief bullet list of which conventions were applied and which validation commands were run.

## Error handling

- If `npm run lint` fails after changes, report verbatim and fix before declaring success.
- If a test fails due to a missing session file, instruct the user to run the matching `e2e:create-session:*` command rather than attempting to fix it in code.

## Validation

```bash
npm run lint
```

## Skill handoffs

- Unit or hook tests → load `unit-test-best-practices` or `unit-test-hook-best-practices`.
- TypeScript errors in spec files → load `typescript-best-practices`.
