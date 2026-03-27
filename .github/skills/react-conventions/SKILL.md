---
name: react-conventions
description: >
  React 18+ conventions for this project — React Compiler (no manual
  memoization), ReactElement ambient type, useEffect comment rule, component
  organization. Use when authoring or editing any React component, hook, or
  page. Do NOT use for general TypeScript-only utilities with no React imports
  — load typescript-conventions instead.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Depends on:** [`manage-page-patterns/SKILL.md`](/.github/skills/manage-page-patterns/SKILL.md) — load when the task involves admin/manage page mutations. [`supabase-client-patterns/SKILL.md`](/.github/skills/supabase-client-patterns/SKILL.md) — load when the task involves React-side Supabase queries.

## Full reference

- React conventions: [references/REFERENCE.md](/.github/skills/react-conventions/references/REFERENCE.md) — load on demand for deep dives
- Zustand in React: [references/ZUSTAND.md](/.github/skills/react-conventions/references/ZUSTAND.md) — load when the task involves store selectors or slices

## When invoked

**Preconditions:**
- Read the component/hook file before editing.
- Check `.agent/rules.md` for repo-wide constraints.

**Clarifying questions:**
- **Defaults (proceed without asking):** apply all core rules below; edit the file already open or mentioned.
- **Always ask:** which file if not specified and cannot be inferred.

**Output format:**
- Write code changes directly. After edits, output a brief bullet list of which conventions were applied and why, and which validation commands were run.
- For question-answering: concise prose with inline code.

**Error handling:**
- If `npm run lint` or `npx tsc -b .` fails after changes, report verbatim and fix before declaring success.
- If the task would require memoization with documented justification, flag it and ask the user to confirm before adding it.

## Core rules

- **No manual memoization** — React Compiler handles optimization. Do not introduce `useCallback`, `useMemo`, or `memo` unless there is a documented performance reason and explicit human approval.
- **`useEffect` comment** — every `useEffect` block must have a `//` comment on the line directly above it explaining why the effect exists.
- **Complete dependency arrays** — keep `useEffect` dependency arrays complete; do not suppress the lint rule.
- **`ReactElement` is ambient** — do not import it from `react`; it is available globally in this project.
- **One component per file** — keep one primary component per file; colocate its tests.
- **Direct imports** — no barrel re-exports; import directly from source files.
- **Prefer plain function declarations** for event handlers and local callbacks (e.g. `function handleClick(): void {}`).

## Validation

```bash
npx tsc -b .
npm run lint
```

## Evaluations (I/O examples)

**Input:** "Remove the useCallback from this event handler in `MyComponent.tsx`"
**Expected:** Agent reads the file, removes `useCallback` wrapper, converts to a plain `function handle(): void {}` declaration, runs `npm run lint` and `npx tsc -b .`, reports what changed and that React Compiler now handles memoization automatically.

**Input:** "Add a useEffect that syncs `selectedId` to localStorage"
**Expected:** Agent adds `useEffect` with a `//` comment above it explaining why, includes `selectedId` in the dependency array, runs lint. Does not add `useCallback` to the setter.

**Input:** "Write tests for `useMyHook.ts`"
**Expected:** Agent loads `unit-test-hook-best-practices` skill and proceeds per that skill's guidance, not this one.

## Do not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not introduce `useCallback`/`useMemo`/`memo` without documented justification and user approval.
- Do not expand scope beyond the requested task without calling it out.
