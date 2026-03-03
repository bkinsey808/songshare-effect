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
- For mocking strategies, see [unit-testing-mocking](../unit-testing-mocking/SKILL.md) (core), [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md) (ESM/Effect), and [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md) (shared helpers).
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

## Which skills to load for your task

Loading only `unit-testing` is rarely sufficient. Use this as a routing guide before writing any code:

**Hook test** (any `use*.ts` / `use*.tsx` file) — load all four together:

- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, Harness requirement (read first)
- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — full Harness template, completeness, cleanup, describe block ordering
- [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — ⚠️ load _before_ writing Harness JSX: React Compiler constraint + oxlint traps
- [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md) — one-behavior-per-test, named constants, pre-completion checklist

  Also load when relevant:
  - [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, `forceCast`, shared constants
  - [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md) — hook calls `Effect.runPromise(subscribeFn(...))`
  - [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — mocking modules beyond `useAppStore`
  - [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — async patterns, mock accumulator anti-patterns

**API handler test** (`api/src/**/*.test.ts`):

- [unit-testing-api](../unit-testing-api/SKILL.md) — makeCtx, makeSupabaseClient, MockRow, Effect.runPromise
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — factoryless vi.mock, vi.spyOn patterns
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — common async/assertion mistakes

**Pure utility / module test** (non-hook, non-API):

- This file covers most of what you need (templates, named constants, validation commands)
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — if external modules need to be mocked
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — anti-patterns checklist

---

## Core Setup

_Note:_ helper modules intended solely for unit tests should be named with a `.test-util.ts` or `.test-util.tsx` suffix so their purpose is obvious and they don't get mistaken for production code.

1. Use the included `test-template.test.ts` as a starting point for new tests.
2. Prefer descriptive test names and one behavior per test.
3. Use `vi.useFakeTimers()` only when verifying timer behavior and always restore with `vi.useRealTimers()`.
4. **RouterWrapper** – most hook tests need React Router context. Import `RouterWrapper` from `@/react/lib/test-utils/RouterWrapper` and pass it as the `wrapper` option to `renderHook`.
5. Mock only external dependencies (network calls, browser APIs). **Simple, deterministic pure functions should be tested with their real implementations** — mocking them adds maintenance burden and can hide problems. **Never mock Node.js built-ins** (`node:fs/promises`, `node:path`, etc.); use real `mkdtemp`/`rm` temp directories instead (see [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md)).
6. Use shared helpers under `react/src/lib/test-utils` (`asNull`, `asNever`, `asPostgrestResponse`, `waitForAsync`, `makeChangeEvent`, `spyImport`, `makeAppSlice`).
7. Before running your spec, **make sure lint passes**. New test files will fail to execute if the codebase is not clean.
8. Prefer asserting against named constants rather than duplicated literal strings. Define `const songId = "s1"` and use that variable in both setup and expectations.
9. Always use `toStrictEqual` instead of `toEqual` — the linter enforces this. Use `toSorted()` instead of `sort()` for non-mutating sorted comparisons (e.g. `expect(result.toSorted()).toStrictEqual(expected.toSorted())`).

---

## Mocking Quick Reference

See [unit-testing-mocking](../unit-testing-mocking/SKILL.md) for core patterns, [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md) for ESM/Effect and `init()`, and [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md) for shared callable helpers. Key rules:

- **Prefer factoryless `vi.mock("path")`** — single argument, then `vi.mocked(fn).mockReturnValue(...)` at module level. Works for all return types including Effects.
- **Avoid typed factories** — typed `vi.mock("path", () => ({ ... }))` breaks for Effect generics.
- **Avoid lifecycle hooks** (`beforeEach`/`beforeAll`) — use an `async init()` function inside `describe` instead.
- **Use `asPostgrestResponse({...})`** for Supabase mock shapes; never `as any`.
- **Helper modules must not contain top-level `vi.mock` calls** — export a callable `mockFoo()` that uses `vi.doMock` when invoked.

---

## Script / pure-logic module testing

When a `.bun.ts` entry-point script contains non-trivial logic, extract that logic into a **pure, Node-importable module** (e.g. `checkSkillFiles.ts`) and test the module directly. This avoids spawning `bun` in tests, which is fragile in environments where Bun is not globally installed.

Pattern:

```ts
// checkSkillFiles.ts — pure module, import-able under Node
export async function checkSkillFiles(repoRoot: string, opts: CheckOptions = {}): Promise<CheckResult> { ... }

// checkSkillFiles.test.ts — tested with Vitest, no bun spawn needed
import { checkSkillFiles } from "./checkSkillFiles";
```

The `.bun.ts` entry point becomes a thin shell that reads `import.meta.dir`, calls the pure function, and handles `process.exit` / stream writes. It does **not** need its own test file.

---

## Practical Learnings

- Prefer reuse of shared fake clients (`makeFakeClient`/`makeSupabaseClient`) over hand-rolling `{}` casts.
- Extract typed slice/get factories for repeated stubs into `*-test-util.ts` files.
- Localize any `oxlint-disable` to helpers, never in test bodies. Module-level disables are forbidden in test files.
- Prefer function declarations with explicit return types in helpers.
- Document test helpers with JSDoc: purpose, params, and why any cast is acceptable.
- **Wrap all tests in a `describe` block** — the `eslint-plugin-jest/require-top-level-describe` rule enforces this. All `test`/`it` calls at the top level will fail lint.
- **Use `it` inside `describe`, `test` at the top level** — `eslint-plugin-jest/consistent-test-it` enforces `it` within `describe` blocks. If all tests are inside `describe`, import and use `it` (not `test`).
- **Every numeric literal needs a named constant** — `no-magic-numbers` applies even to `0`, `1`, and arithmetic offsets like `index + 1`. Define constants at the top of the file (e.g. `const LINE_OFFSET = 1`, `const NO_ERRORS = 0`). For hook tests, see the full treatment in [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md).
- **Use `toHaveLength()` for array length assertions** — `expect(arr).toHaveLength(0)` not `expect(arr.length).toBe(0)`.
- **Avoid single-character callback parameter names** — `id-length` rejects `_` and `i` even in `Array.from` callbacks. Use `_el, index` instead.
- **Every string literal used more than once needs a named constant** — e.g. `const NEWLINE = "\n"` instead of inline `"\n"`.
- **Function parameters: use options objects to avoid `max-params`** — ESLint's `max-params` (max 3) will flag functions with many positional injectable args. Group them into a single `opts: Options = {}` parameter.

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

- [**unit-testing-hooks**](../unit-testing-hooks/SKILL.md) — core hook testing: renderHook, installStore, Harness requirement
- [**unit-testing-hooks-checklist**](../unit-testing-hooks-checklist/SKILL.md) — one-behavior-per-test, named constants, pre-completion checklist
- [**unit-testing-hooks-harness**](../unit-testing-hooks-harness/SKILL.md) — "Documentation by Harness" pattern (always required), DOM-interaction tests, completeness checklist, cleanup
- [**unit-testing-hooks-harness-lint**](../unit-testing-hooks-harness-lint/SKILL.md) — Harness lint/compiler traps: React Compiler destructure constraint, query helper rules, oxlint pitfalls
- [**unit-testing-hooks-fixtures**](../unit-testing-hooks-fixtures/SKILL.md) — mock data, forceCast, shared constants, filter-query specificity
- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — Core vi.mock/vi.spyOn, Supabase stubs, clearing/resetting
- [**unit-testing-mocking-esm**](../unit-testing-mocking-esm/SKILL.md) — ESM/Effect, `init()`, lifecycle hook avoidance
- [**unit-testing-mocking-helpers**](../unit-testing-mocking-helpers/SKILL.md) — Callable helpers, `vi.hoisted()`, typed retrieval
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Effect-based Hono handler testing
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Common anti-patterns to avoid
- Agent guidance: [.github/agents/Unit Test Agent.agent.md](../../agents/Unit Test Agent.agent.md)
- Vitest documentation: https://vitest.dev/
- Testing Library: https://testing-library.com/
