---
name: unit-testing
description: Core Vitest setup, templates, and shared patterns for unit tests in this repo. Covers file naming, RouterWrapper, shared test-utils, and validation commands. For mocking strategies, API handler testing, or common pitfalls see the linked sub-skills.
license: MIT
compatibility: Vitest 1.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing Skill (Core)

**What this skill does**

- Provides a lightweight Vitest test template and core best-practice guidance.
- For mocking strategies, see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).
- For API handler testing, see [unit-testing-api](../unit-testing-api/SKILL.md).
- For common pitfalls, see [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md).

**When to use**

- When adding or updating unit tests for components, hooks, and utilities.
- When you want a quick, consistent test template or baseline checklist.

**When NOT to write a test**

- **Trivial getters / pure config objects** — a function that returns a constant or reads a single field provides no falsifiable behavior worth asserting.
- **Generated or vendored code** — files under `generated/` or third-party wrappers that you don't own.
- **Test-util helpers themselves** — helpers like `asPostgrestResponse` or `makeCtx` are infrastructure, not behavior; they don't need their own specs.
- **One-liner re-exports** — if the only logic is `export default someLib.method`, the test would just verify that JS imports work.

If you find yourself writing a test that asserts an import exists or that a constant equals itself, skip it.

---

## Core Setup

_Note:_ helper modules intended solely for unit tests should be named with a `.test-util.ts` or `.test-util.tsx` suffix so their purpose is obvious and they don't get mistaken for production code.

1. Use the included `test-template.test.ts` as a starting point for new tests.
2. Prefer descriptive test names and one behavior per test.
3. Use `vi.useFakeTimers()` only when verifying timer behavior and always restore with `vi.useRealTimers()`.
4. **RouterWrapper** – most hook tests need React Router context. Import `RouterWrapper` from `@/react/lib/test-utils/RouterWrapper` and pass it as the `wrapper` option to `renderHook`.
5. Mock only external dependencies (network calls, browser APIs). **Simple, deterministic pure functions should be tested with their real implementations** — mocking them adds maintenance burden and can hide problems.
6. Use shared helpers under `react/src/lib/test-utils` (`asNull`, `asNever`, `asPostgrestResponse`, `waitForAsync`, `makeChangeEvent`, `spyImport`, `makeAppSlice`).
7. Before running your spec, **make sure lint passes**. New test files will fail to execute if the codebase is not clean.
8. Prefer asserting against named constants rather than duplicated literal strings. Define `const songId = "s1"` and use that variable in both setup and expectations.

---

## Mocking Quick Reference

See [unit-testing-mocking](../unit-testing-mocking/SKILL.md) for full guidance. Key rules:

- **Prefer factoryless `vi.mock("path")`** — single argument, then `vi.mocked(fn).mockReturnValue(...)` at module level. Works for all return types including Effects.
- **Avoid typed factories** — typed `vi.mock("path", () => ({ ... }))` breaks for Effect generics.
- **Avoid lifecycle hooks** (`beforeEach`/`beforeAll`) — use an `async init()` function inside `describe` instead.
- **Use `asPostgrestResponse({...})`** for Supabase mock shapes; never `as any`.
- **Helper modules must not contain top-level `vi.mock` calls** — export a callable `mockFoo()` that uses `vi.doMock` when invoked.

---

## Practical Learnings

- Prefer reuse of shared fake clients (`makeFakeClient`/`makeSupabaseClient`) over hand-rolling `{}` casts.
- Extract typed slice/get factories for repeated stubs into `*-test-util.ts` files.
- Localize any `oxlint-disable` to helpers, never in test bodies. Module-level disables are forbidden in test files.
- Prefer function declarations with explicit return types in helpers.
- Document test helpers with JSDoc: purpose, params, and why any cast is acceptable.

---

## Examples

- See [test-template.test.ts](./test-template.test.ts) for a minimal setup and assertion pattern.

---

## Validation Commands

**When working on a single file, run tests only for that file** to get faster feedback:

```bash
# Run tests for a specific file (recommended while working on it)
npm run test:unit -- src/utils/myUtil.test.ts

# Run tests for a specific file with coverage
npm run test:unit -- src/utils/myUtil.test.ts --coverage

# Watch mode for a specific file (ideal for TDD)
npm run test:unit -- src/utils/myUtil.test.ts --watch

# Run all unit tests (before submitting PR)
npm run test:unit

# Run all tests with coverage report
npm run test:unit -- --coverage
```

## References

- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — vi.mock, vi.hoisted, Supabase stubs, callable helpers
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Effect-based Hono handler testing
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Common anti-patterns to avoid
- Agent guidance: [.github/agents/Unit Test Agent.agent.md](../../agents/Unit Test Agent.agent.md)
- Vitest documentation: https://vitest.dev/
- Testing Library: https://testing-library.com/
