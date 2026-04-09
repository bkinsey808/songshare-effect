---
name: unit-test-hook-best-practices
description: Complete guide for testing React hooks — renderHook, Documentation by Harness, installStore, fixtures, subscription patterns, lint/compiler traps, and pre-completion checklist. Read docs/unit-test-hook-best-practices.md for the full reference.
---

**Requires:** file-read, terminal (test runner). No network access needed.

**Also load:** [`unit-test-best-practices/SKILL.md`](/.github/skills/unit-test-best-practices/SKILL.md)
— hook tests must follow all conventions from the general skill (AAA pattern, named constants,
mocking order, `toStrictEqual`, lint rules) in addition to the hook-specific rules here.

# Unit Testing — React Hooks

## Use When

Use this skill when:

- Writing or editing tests for any `use*.ts` / `use*.tsx` hook.
- Validating hook behavior, side effects, and cleanup logic.

Execution workflow:

1. Cover behavior with both `renderHook` tests and Harness-style tests when applicable.
2. Keep tests colocated and use shared wrappers/utilities.
3. Verify async behavior and cleanup paths explicitly.
4. Run targeted hook tests first, then broader checks.

Output requirements:

- State which behaviors were covered by `renderHook` vs Harness tests.
- Report exact test/lint commands run.

## Key Requirements

- Use **separate `describe` blocks** for renderHook tests and Harness tests:
  `describe("useMyHook — Harness", ...)` and `describe("useMyHook — renderHook", ...)`.
- Follow hook testing conventions in project docs.
- Prefer deterministic assertions over timing-based checks.
- Keep fixtures typed and reusable.
- **Always use the AAA pattern** — every `it` block must have explicit `// Arrange`, `// Act`,
  `// Assert` comments. For tests that only verify initial state, use `// Arrange + Act` on the
  setup line and `// Assert — no Act: verifying initial render state only`. For multi-step tests,
  label each step `// Act — cycle 1`, `// Act — cycle 2`, etc.
- **`vi.resetAllMocks()` in shared setup helpers** — any `setup*()` helper shared across tests
  must call `vi.resetAllMocks()` as its first line to prevent mock call-count leakage.
- **Mocked sub-hook setters** — when the hook under test calls a mocked sub-hook (e.g.
  `useItemTags`), its returned setters are `vi.fn()` stubs that don't update React state. Assert
  on a module-level named spy instead of expecting DOM changes.
- **`no-negated-condition` in JSX** — write `x === undefined ? "absent" : "present"`, not
  `x !== undefined ? "present" : "absent"`.

## References

- Full hook testing guide: [docs/unit-test-hook-best-practices.md](/docs/unit-test-hook-best-practices.md)
- General testing guide: [docs/unit-test-best-practices.md](/docs/unit-test-best-practices.md)
- Non-hook tests: [../unit-test-best-practices/SKILL.md](/.github/skills/unit-test-best-practices/SKILL.md)

## Validation

```bash
npm run test:unit -- path/to/useMyHook.test.tsx
npx oxlint --config .oxlintrc.json --type-aware path/to/useMyHook.test.tsx
npm run test:unit
```

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- The general skill is a hard dependency — it must always be loaded alongside this one (see **Also load** at the top).
- If hook behavior depends on routing or page components, also load `react-conventions`.
