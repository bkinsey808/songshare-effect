---
name: react-conventions
description: React 18+ conventions for this project — React Compiler (no manual memoization), ReactElement ambient type, useEffect comment rule, component organization. Use when authoring or editing any React component, hook, or page.
license: MIT
compatibility: React 18+, React Compiler enabled, TypeScript 5.x
metadata:
  author: bkinsey808
  version: "1.1"
---

# React Conventions Skill

## What This Skill Does

Captures **repo-specific** React patterns. Generic React knowledge (functional components, prop types, Tailwind) is excluded — focus here is on project-enforced rules:

- **No manual memoization** — React Compiler handles it; `useMemo`/`useCallback`/`memo` are forbidden without documented profiling evidence
- **ReactElement ambient** — no import needed; `JSX.Element` is discouraged
- **`useEffect` must have a comment** — every `useEffect` call needs a `//` comment above it
- **`RouterWrapper` in hook tests** — use the shared helper, not ad-hoc memory routers
- **One file, one component** — colocated tests

## Key Rules

### ReactElement vs JSX.Element

`ReactElement` is an **ambient type** in this project — never import it. Using `JSX.Element` will trigger lint warnings.

```ts
// ✅ GOOD — ReactElement is globally available
function MyComponent(): ReactElement {
  return <div />;
}

// ❌ BAD — import not needed, linter will flag it
import type { ReactElement } from "react";

// ❌ BAD — JSX.Element is discouraged
function MyComponent(): JSX.Element {
  return <div />;
}
```

### §1. React Compiler Ready — No Manual Memoization

**Never use** `memo`, `useMemo`, or `useCallback`. React Compiler optimizes automatically.

```typescript
// ❌ BAD
const handleClick = useCallback(() => doThing(), []);
const value = useMemo(() => compute(), [deps]);
const Comp = memo(() => <div />);

// ✅ GOOD — plain functions, no wrappers
function handleClick(): void { doThing(); }
const value = compute();
function Comp(): ReactElement { return <div />; }
```

**Exception**: Only if profiling shows a documented regression. Add a comment with issue link.

### §2. Hook Patterns

**Always add a `//` comment above each `useEffect`** — this is enforced by the `require-useeffect-comment` lint rule:

```typescript
// ✅ GOOD — comment required
// Fetches latest user profile when userId changes.
useEffect(() => {
  void fetchUserProfile(userId);
}, [userId]);

// ❌ BAD — missing comment; lint will fail
useEffect(() => {
  void fetchUserProfile(userId);
}, [userId]);
```

**Complete dependency arrays** — never omit a dependency to suppress the lint warning:

```typescript
// ❌ BAD — userId missing from deps (stale closure)
useEffect(() => { fetchUser(userId); }, []);

// ✅ GOOD
useEffect(() => { fetchUser(userId); }, [userId]);
```

**In hook tests**, use the shared `RouterWrapper` from `@/react/lib/test-utils/RouterWrapper` — do not re-implement a memory router per test file.

### §3. Component Organization

**One main export per file.** Colocate the test next to the source:

```
react/src/components/
  SongCard.tsx
  SongCard.test.tsx    ← same directory
```

**Avoid `oxlint-disable` inside test blocks.** If a disable is needed, move it to a small helper or fix the type problem.

### §4. State Management

Use Zustand for shared state, `useState` for component-local data.

```typescript
// Zustand — use selectors to avoid unnecessary re-renders
const user = useAppStore((state) => state.user);
```

See [ZUSTAND.md](references/ZUSTAND.md) for store patterns, async actions, middleware, and testing.

---

## Common Pitfalls

### ❌ Keeping `useCallback` when migrating to React Compiler

```typescript
// BAD — remove manual optimizations
const handleClick = useCallback(() => { doThing(); }, []);

// GOOD
function handleClick(): void { doThing(); }
```

### ❌ Stale closures in event handlers

```typescript
// BAD — userId captured at creation time
const handleDelete = () => { deleteUser(userId); }; // possible stale ref

// GOOD — passed inline, always fresh
<button onClick={() => deleteUser(userId)}>Delete</button>
```

---

## Manage-Page Mutations

Admin/manage pages have a required pattern for mutations (invite, kick, add, remove):
use **local `actionState`** via `runCommunityAction`/`runAction` — never store-level loading flags.

See [manage-page-patterns skill](../manage-page-patterns/SKILL.md) for the full pattern, realtime update path, and exclusion list rules.

---

## Deep Reference

[references/REFERENCE.md](references/REFERENCE.md) — React Compiler behavior, Zustand patterns, Tailwind styling, component composition.

## Validation

```bash
npx tsc -b .
npm run lint
```
