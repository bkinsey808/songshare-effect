---
name: unit-testing-hooks
description: Complete guide for testing React hooks — renderHook, Documentation by Harness, installStore, fixtures, subscription patterns, lint/compiler traps, and pre-completion checklist. Read docs/unit-testing-hooks.md for the full reference.
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+, React Compiler
metadata:
  author: bkinsey808
  version: "2.0"
---

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

- Follow hook testing conventions in project docs.
- Prefer deterministic assertions over timing-based checks.
- Keep fixtures typed and reusable.

## References

- Full hook testing guide: [docs/unit-testing-hooks.md](../../../docs/unit-testing-hooks.md)
- General testing guide: [docs/unit-testing.md](../../../docs/unit-testing.md)
- Non-hook tests: [../unit-testing/SKILL.md](../unit-testing/SKILL.md)

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

- For non-hook tests in the same task, also load `unit-testing`.
- If hook behavior depends on routing or page components, also load `react-conventions`.
