---
name: react-best-practices
description: >
  React 18+ conventions for this project — React Compiler (no manual
  memoization), ReactElement ambient type, useEffect comment rule, plain
  function declarations, file and import conventions. Use when authoring or
  editing any React component, hook, or page. Do NOT use for general
  TypeScript-only utilities with no React imports — load
  typescript-best-practices instead.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Full reference:** [/docs/client/react-best-practices.md](/docs/client/react-best-practices.md)

**Companion skill (load on demand):**
- Zustand store selectors/slices → [zustand-best-practices/SKILL.md](/skills/zustand-best-practices/SKILL.md)

**Depends on:** [`manage-page-patterns/SKILL.md`](/skills/manage-page-patterns/SKILL.md) — load when the task involves admin/manage page mutations. [`supabase-client-patterns/SKILL.md`](/skills/supabase-client-patterns/SKILL.md) — load when the task involves React-side Supabase queries.

## Preconditions

- Read the component/hook file before editing.
- Check `docs/ai/rules.md` for repo-wide constraints.

## Defaults (proceed without asking)

- Apply all key rules below; edit the file already open or mentioned.
- **Always ask:** which file if not specified and cannot be inferred.

## Key rules

- **Prefer required props** — avoid many optional props; use noops/fallback refs at call sites instead of optional handlers.
  [→ full detail](/docs/client/react-best-practices.md#prefer-required-props)

- **No `React.FC`** — use an explicit prop type and `): ReactElement` return annotation.
  [→ full detail](/docs/client/react-best-practices.md#avoid-react-fc)

- **`ReactElement` is ambient** — do not import it; `ReactNode` must be imported.
  [→ full detail](/docs/client/react-best-practices.md#common-prop-types)

- **Plain function declarations** — use `function handleClick(): void {}` over arrow assignments for handlers and components.
  [→ full detail](/docs/client/react-best-practices.md#function-declaration-style)

- **`useEffect` comment** — add a `//` comment on the line directly above every `useEffect` explaining why it exists.
  [→ full detail](/docs/client/react-best-practices.md#useeffect-rules)

- **Complete dependency arrays** — do not suppress the exhaustive-deps lint rule; restructure instead.
  [→ full detail](/docs/client/react-best-practices.md#useeffect-rules)

- **No manual memoization** — React Compiler handles optimization; never add `useCallback`, `useMemo`, or `memo` without documented justification and explicit user approval.
  [→ full detail](/docs/client/react-best-practices.md#react-compiler)

- **One component per file** — colocate tests in the same directory.
  [→ full detail](/docs/client/react-best-practices.md#file-and-import-conventions)

- **Direct imports** — no barrel `index.ts` re-exports; import from source files.
  [→ full detail](/docs/client/react-best-practices.md#file-and-import-conventions)

## Output format

Write code changes directly. After edits, output a brief bullet list of which conventions were applied and why, and which validation commands were run. For question-answering: concise prose with inline code.

## Error handling

- If `npm run lint` or `npx tsc -b .` fails after changes, report verbatim and fix before declaring success.
- If the task would require memoization, flag it and ask the user to confirm before adding it.

## Validation

```bash
npm run lint
```

## Evaluations (I/O examples)

**Input:** "Remove the useCallback from this event handler in `MyComponent.tsx`"
**Expected:** Reads the file, removes `useCallback` wrapper, converts to `function handle(): void {}`, runs lint and tsc, reports what changed and that React Compiler handles memoization.

**Input:** "Add a useEffect that syncs `selectedId` to localStorage"
**Expected:** Adds `useEffect` with a `//` comment above it explaining why, includes `selectedId` in the dep array, runs lint. Does not add `useCallback`.

**Input:** "Write tests for `useMyHook.ts`"
**Expected:** Loads `unit-test-hook-best-practices` skill and proceeds per that skill's guidance, not this one.

## Skill handoffs

- Hook tests → load `unit-test-hook-best-practices`.
- TypeScript-only files → load `typescript-best-practices` instead.
- Admin/manage page mutations → also load `manage-page-patterns`.
- React-side Supabase queries → also load `supabase-client-patterns`.
