---
name: lint-first-authoring
description: >
  Lint-first coding workflow for this repo. Use when authoring or editing code
  and the goal is to produce changes that pass lint on the first try by matching
  local patterns, applying repo-specific constraints early, and validating before
  finishing. Do NOT use when the main task is fixing existing lint failures after
  they appear; use lint-error-resolution for that.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Full reference:** [/docs/lint-best-practices.md](/docs/lint-best-practices.md)

## Use when

- Writing new code in this repo.
- Refactoring existing code with minimal drift.
- Prompting an agent to avoid predictable lint failures on first pass.

## Do not use when

- The primary task is resolving existing lint, ESLint, oxlint, or TypeScript errors.
- The task is docs-only or otherwise unrelated to code authoring.

## Preconditions

- Read `AGENTS.md` and `.agent/rules.md`.
- Read the file being changed and at least one nearby file that already follows the local pattern.
- Load the most relevant companion skill for the area being edited.

## Execution workflow

1. Read [/docs/lint-best-practices.md](/docs/lint-best-practices.md) and apply the relevant sections before editing.
2. Match the surrounding file’s structure, naming, and import style.
3. Keep the change minimal and local to the requested behavior.
4. Reuse existing helpers and established patterns instead of inventing new ones.
5. Run `npm run lint` after meaningful changes and fix any issues before finishing.

## Defaults

- No `any`; use `unknown` plus guards or schema validation.
- No barrel files; import directly from source files.
- Use `import type` when appropriate.
- Prefer explicit return types.
- Add a comment directly above every `useEffect`.
- Do not add lint-disable comments in test files.
- Do not add manual memoization unless the task explicitly requires it and surrounding code already supports it.

## Prompt Template

Use this prompt when the user wants an agent to write lint-clean code:

```text
Read AGENTS.md, .agent/rules.md, and docs/lint-best-practices.md first.
Match surrounding patterns exactly.
No any, no barrel files, no test-file lint disables, and no unnecessary memoization.
Use explicit types, safe validation, direct imports, and useEffect comments.
Run npm run lint after editing and fix any issues before finishing.
```

## Companion skills

- TypeScript files: [typescript-best-practices](/skills/typescript-best-practices/SKILL.md)
- React components/hooks: [react-best-practices](/skills/react-best-practices/SKILL.md)
- Existing lint failures: [lint-error-resolution](/skills/lint-error-resolution/SKILL.md)
- Unit tests: [unit-test-best-practices](/skills/unit-test-best-practices/SKILL.md)
- Hook tests: [unit-test-hook-best-practices](/skills/unit-test-hook-best-practices/SKILL.md)

## Output format

- Apply the code change directly.
- Report which repo-specific rules were applied.
- Report whether `npm run lint` was run and whether it passed.

## Evaluations (I/O examples)

**Input:** "Add a new React hook and keep it lint-safe."
**Expected:** Reads the target file and nearby patterns, loads `react-best-practices`, writes the hook without `any` or manual memoization, adds any required `useEffect` comments, runs `npm run lint`, and reports the validation result.

**Input:** "Generate a new API helper that should pass lint on first try."
**Expected:** Reads nearby API helpers, avoids unsafe assertions, prefers schema validation or guards, uses direct imports, runs `npm run lint`, and reports what was checked.
