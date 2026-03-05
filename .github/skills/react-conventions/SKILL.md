---
name: react-conventions
description: React 18+ conventions for this project — React Compiler (no manual memoization), ReactElement ambient type, useEffect comment rule, component organization. Use when authoring or editing any React component, hook, or page.
compatibility: React 18+, React Compiler enabled, TypeScript 5.x
metadata:
  author: bkinsey808
  version: "1.1"
---

# React Conventions Skill

## Use When

Use this skill when:
- Editing components, pages, or hooks under `react/`.
- Resolving React lint/style issues tied to repo conventions.

Execution workflow:
1. Apply core rules first: no `memo`/`useMemo`/`useCallback` unless explicitly justified.
2. Ensure every `useEffect` has a `//` comment directly above it.
3. Use ambient `ReactElement` conventions and avoid unnecessary type imports.
4. Keep one primary component per file and colocate tests.
5. Run targeted tests where relevant, then `npm run lint`.

Output requirements:
- Summarize which conventions were enforced.
- Call out any explicit exception and why.

## Core Rules

- Do not manually memoize by default; React Compiler handles optimization.
- Keep `useEffect` dependency arrays complete.
- Use shared test wrappers (for example `RouterWrapper`) in hook/component tests.
- Prefer clear component boundaries and direct imports.

## References

- Deep reference: [references/REFERENCE.md](references/REFERENCE.md)
- Manage page mutation pattern: [../manage-page-patterns/SKILL.md](../manage-page-patterns/SKILL.md)

## Validation

```bash
npx tsc -b .
npm run lint
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

- If the task is primarily form submission/validation, also load `form-patterns`.
- If the task includes React-side Supabase querying, also load `supabase-client-patterns`.
