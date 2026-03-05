---
name: unit-testing
description: Core Vitest setup, mocking strategies, API handler testing, and common pitfalls for unit tests in this repo. Read docs/unit-testing.md for the full reference. For React hook tests, use the unit-testing-hooks skill instead.
compatibility: Vitest 1.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "2.0"
---

# Unit Testing

Full reference: [docs/unit-testing.md](../../../docs/unit-testing.md)

---

## Use When

- Adding or updating unit tests for components, utilities, API handlers, or scripts
- Questions about mocking patterns, pitfalls, or test structure for non-hook code

For **React hook tests**, load the `unit-testing-hooks` skill instead.

Execution workflow:
1. Pick the smallest relevant test scope first (`path/to/file.test.ts`).
2. Use repo test patterns and mocking helpers before ad-hoc test doubles.
3. Keep assertions strict and deterministic.
4. Re-run targeted tests, then broaden as needed.

Output requirements:
- Report which tests were added or changed and why.
- Report exactly which test commands were run.

---

## Quick summary of what the docs cover

- **When NOT to write a test** (trivial getters, generated code, test-util helpers)
- **Routing guide** — which section to consult for hook vs. API vs. utility tests
- **Core setup** — file naming, `describe`/`it` rules, named constants, `toStrictEqual`, lint rules
- **Mocking** — default to non-factory `vi.mock("path")` + `vi.mocked(...)` for module boundaries,
  use `vi.spyOn` as a targeted escape hatch, plus `vi.doMock` exception flow (`init()` +
  `vi.resetModules()` + dynamic import), Supabase stubs, ESM/Effect patterns, shared callable
  helpers, `vi.hoisted()`, `forceCast`
- **API handler testing** — `makeCtx`, `makeSupabaseClient`, `MockRow<T>`, `Effect.runPromise`
- **Common pitfalls** — magic numbers, `as any`, `act`, async races, lint-disable hygiene,
  `toSorted()`, Node.js built-in mocking

## Validation commands

```bash
npm run test:unit -- path/to/file.test.ts   # targeted (fastest)
npm run test:unit                            # all tests (before PR)

```

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.
- Do not reinvent mock guidance in-line; follow the canonical `docs/unit-testing.md` mocking
  section for full `vi.mock` vs `vi.spyOn` patterns.
- Do not mock `effect` at module level (`vi.mock("effect")` with or without factory). Mock your own
  boundary module and return real `Effect` values.
- Do not treat `vi.hoisted()` or `vi.importActual()` as baseline patterns; they are exception paths.

## Mocking Order (Quick)

1. Use non-factory `vi.mock("path")` + `vi.mocked(...)` by default.
2. Use `vi.spyOn(...)` only for one-off partial overrides on stable references.
3. Use `vi.doMock(...)` only when runtime-dependent per-test mocking is required before importing
   the SUT.
4. Use factory mocks / `vi.importActual` / `vi.hoisted` only for explicit advanced cases that
   cannot be expressed with the default pattern.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If the target under test is a React hook (`use*.ts` / `use*.tsx`), also load `unit-testing-hooks`.
- If the test requires complex mock architecture, also load `scripts` for helper extraction patterns.
