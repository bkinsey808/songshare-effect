---
name: unit-test-best-practices
description: >
  Vitest unit test authoring for this repo — setup, mocking, API handler
  testing, and common pitfalls for non-hook code. Use when the user asks to
  add, update, fix, or review unit tests for utilities, components, API
  handlers, or scripts. Do NOT use for React hook tests — load
  unit-test-hook-best-practices instead.
---

**Requires:** file-read, terminal (test runner). No network access needed.

**Depends on:** [`unit-test-hook-best-practices/SKILL.md`](/.github/skills/unit-test-hook-best-practices/SKILL.md)
— load when the target under test is a React hook (`use*.ts` / `use*.tsx`).

## Full reference

[docs/unit-test-best-practices.md](/docs/unit-test-best-practices.md) — load on demand for
deep dives into mocking patterns, API handler setup, or advanced tradeoffs.

## When invoked

**Preconditions:**
- Read the existing test file (if any) before modifying it.
- Read the source file under test to understand its imports and structure.
- Check `.agent/rules.md` for repo-wide constraints before proceeding.

**Clarifying questions:**
- **Defaults (proceed without asking):** add tests in the same file as
  existing tests; use AAA pattern; follow the mocking order below.
- **Always ask:** which file to test if not specified; which behavior to
  cover if the request is "add tests" with no further detail.
- State assumptions when proceeding: "Adding tests to `foo.test.ts` — let
  me know if a different file is intended."

**Output format:**
- Write test code in a fenced TypeScript code block.
- After the code, output a brief bullet list: which tests were added/changed
  and why, and which test command was run (or why it was skipped).
- For question-answering (no code change): concise prose with inline code,
  referencing the relevant docs section.

**Error handling:**
- If `npm run test:unit` fails, report the error output verbatim, diagnose
  the root cause, and fix before declaring success.
- If the source file to test does not exist, stop and ask for the correct path.
- Do not skip or hide test failures — always report them.

## Execution workflow

1. Pick the smallest relevant test scope first (`path/to/file.test.ts`).
2. Use repo test patterns and mocking helpers before ad-hoc test doubles.
3. Keep assertions strict and deterministic.
4. Re-run targeted tests, then broaden as needed.

## What the full reference covers

- **When NOT to write a test** (trivial getters, generated code, test-util helpers)
- **Routing guide** — hook vs. API vs. utility tests
- **Core setup** — file naming, `describe`/`it` rules, named constants, `toStrictEqual`, lint rules
- **AAA pattern** — [docs/unit-test-best-practices.md#aaa-testing-pattern](/docs/unit-test-best-practices.md#aaa-testing-pattern)
- **Mocking** — non-factory `vi.mock` + `vi.mocked`, `vi.spyOn` escape hatch, `vi.doMock`
  exception flow, Supabase stubs, ESM/Effect patterns, shared helpers, `vi.hoisted`, `forceCast`
- **API handler testing** — `makeCtx`, `makeSupabaseClient`, `MockRow<T>`, `Effect.runPromise`
- **Common pitfalls** — magic numbers, `as any`, `act`, async races, lint hygiene, `toSorted()`

## Mocking order (quick reference)

1. Use non-factory `vi.mock("path")` + `vi.mocked(...)` by default.
   ([docs](/docs/unit-test-best-practices.md#non-factory-mock))
2. Use `vi.spyOn(...)` only for one-off partial overrides on stable references.
   ([docs](/docs/unit-test-best-practices.md#mock-vs-spyon))
3. Use `vi.doMock(...)` only when runtime-dependent per-test mocking is required before
   importing the SUT. ([docs](/docs/unit-test-best-practices.md#domock))
4. Use factory mocks / `vi.importActual` / `vi.hoisted` only for explicit advanced cases
   that cannot be expressed with the default pattern.
   ([docs](/docs/unit-test-best-practices.md#mock-factory-pattern))

## Do not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.
- Do not reinvent mock guidance inline — follow `docs/unit-test-best-practices.md` for full patterns.
- Do not assert a mocked function's own implementation in the same spec that mocks it;
  assert observable behavior of the system under test instead.
- Do not mock `effect` at module level. Mock your own boundary module and return real
  `Effect` values.
- Do not treat `vi.hoisted()` or `vi.importActual()` as baseline patterns; they are
  exception paths.

## Validation commands

```bash
npm run test:unit -- path/to/file.test.ts   # targeted (fastest)
npm run test:unit                            # all tests (before PR)
```

## Success criteria

- All targeted tests pass.
- Changes follow this skill's conventions and project rules.
- Test commands are run and results reported (or skip is explicitly justified).
- Results clearly summarize behavior impact and remaining risks.

## Evaluations (I/O examples)

**Input:** "Add unit tests for `shared/src/utils/safe.ts`"
**Expected:** Agent reads `safe.ts` and any existing `safe.test.ts`, writes
tests using AAA pattern, runs targeted test command, reports which cases were
added and the full test output.

**Input:** "How should I mock a Supabase query in this repo?"
**Expected:** Agent answers in prose with inline code referencing the Supabase
mocking section of `docs/unit-test-best-practices.md`. No test file modified.

**Input:** "Write tests for my hook `useEventList.ts`"
**Expected:** Agent loads `unit-test-hook-best-practices` skill and proceeds per that
skill's guidance rather than this one.

**Input:** "Add tests" (no file specified)
**Expected:** Agent asks which file to test before proceeding.
