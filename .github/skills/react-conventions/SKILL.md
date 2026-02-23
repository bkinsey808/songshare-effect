---
name: react-conventions
description: React 18+ conventions with React Compiler guidance (no manual memoization, functional components, hooks patterns). Use when authoring components, hooks, or reviewing React code for styling and performance issues.
license: MIT
compatibility: React 18+, React Compiler enabled, TypeScript 5.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# React Conventions Skill

## What This Skill Does

Captures React best practices for this project with emphasis on **React Compiler compatibility**:

- **Compiler-ready code** - No manual memoization (`useMemo`, `useCallback`, `memo`)
- **Functional components** - Plain functions, hooks-based patterns only
- **Styling patterns** - Tailwind CSS integration and best practices
- **Component organization** - One main export per file, colocated tests
- **Hook patterns** - Proper dependency arrays, no stale closures
- **Type safety** - Strong prop typing with TypeScript

## When to Use

- Authoring new React components, hooks, or pages
- Reviewing PRs for React patterns and performance
- Implementing component-specific styling or state management
- Migrating code to React Compiler (removing manual optimizations)
- Creating custom hooks or composable logic

## Key Rules

### ReactElement vs JSX.Element

This project treats `ReactElement` as an **ambient type** rather than requiring
an import from `react`. When specifying component return types or other JSX
values prefer `ReactElement` without importing it. Attempting to import
`ReactElement` or using `JSX.Element` will trigger eslint complaints
(`no-reactelement-import` rule) and confuse tooling. The AI helper may suggest
adding an import; please ignore that advice and leave the type ambient.

```ts
// ✅ GOOD
function MyComponent(): ReactElement {
  return <div />;
}

// ❌ BAD - imports not needed & linter will flag
import type { ReactElement } from "react";
function MyComponent(): ReactElement {
  return <div />;
}

// ❌ BAD - JSX.Element is discouraged
function MyComponent(): JSX.Element {
  return <div />;
}
```

###

### 1. React Compiler Ready

**Never use manual memoization** - React Compiler handles optimization automatically:

```typescript
// ❌ BAD: Unnecessary memoization
const MyComponent = memo(() => {
  return <div>Content</div>;
});

const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

const computedValue = useMemo(() => expensiveComputation(), [deps]);
```

**✅ GOOD: Plain functions - Compiler optimizes automatically:**

```typescript
function MyComponent(): JSX.Element {
  // Plain function - no memo needed
  return <div>Content</div>;
}

function handleClick(): void {
  // Plain function - no useCallback needed
  console.log("clicked");
}

const computedValue = expensiveComputation(); // No useMemo needed
```

**When to break this rule:** Only if there's documented evidence of performance regression. Then add a comment explaining why:

```typescript
// NOTE: Profiling showed unnecessary re-renders (see GitHub issue #123).
// Memoization reduces re-renders from 5x to 1x in this scenario.
const MemoizedComponent = memo(ExpensiveComponent);
```

### 2. Functional Components Only

All components are functional components with hooks:

```typescript
// ❌ BAD: Class components
class UserProfile extends React.Component {
  render() {
    return <div>{this.props.name}</div>;
  }
}

// ✅ GOOD: Functional component
function UserProfile(props: UserProfileProps): JSX.Element {
  return <div>{props.name}</div>;
}
```

### 3. Hook Patterns

**Proper dependency arrays:**

```typescript
// ❌ BAD: Missing or incorrect dependencies
useEffect(() => {
  fetchUser(userId); // userId not in deps - stale closure!
}, []);

// ✅ GOOD: Complete dependency array
useEffect(() => {
  fetchUser(userId);
}, [userId]); // userId included
```

**No hook rules violations:**

```typescript
// ❌ BAD: Hook inside conditional
if (user.isActive) {
  useState("initial"); // NEVER - breaks hook rules
}

// ✅ GOOD: Hooks at top level
const [state, setState] = useState("initial");
```

**Always add a `//` comment above each `useEffect` describing what it does:**

```typescript
// ✅ GOOD: Comment explains the side effect intent

// Fetches latest user profile when userId changes.
useEffect(() => {
  void fetchUserProfile(userId);
}, [userId]);

// ❌ BAD: No explanatory comment above useEffect

useEffect(() => {
  void fetchUserProfile(userId);
}, [userId]);
```

### 4. Component Organization

**Testing helpers** – when writing hook tests, use the shared `RouterWrapper` from `@/react/lib/test-utils/RouterWrapper` instead of re‑implementing a memory router in each file. This keeps routes consistent and avoids repeated imports from `react-router-dom` which often end up unused.

**Lint disables** – React guidelines also apply when writing tests; avoid placing `// oxlint-disable` comments inside test blocks. If a test requires a disable, move it into a small helper or revisit the typing problem.

### 4. Component Organization

**One main component per file:**

```typescript
// ✅ GOOD: SongCard.tsx - single responsibility
export function SongCard(props: SongCardProps): JSX.Element {
  return <div>{/* ... */}</div>;
}

// ✅ GOOD: Colocated test
// SongCard.test.tsx in same directory
```

**Colocated tests:**

```
react/src/components/
  SongCard.tsx
  SongCard.test.tsx      ← Same directory
  UserMenu.tsx
  UserMenu.test.tsx
```

### 5. Prop Typing

**Always type component props:**

```typescript
// ❌ BAD: No prop types
function Button(props) {
  return <button>{props.label}</button>;
}

// ✅ GOOD: Explicit prop type
type ButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

function Button({ label, onClick, disabled }: ButtonProps): JSX.Element {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### 6. State Management

**Use Zustand for shared state:**

```typescript
// ✅ GOOD: Zustand store with selector
export const useAppStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// In component - use selector to avoid unnecessary re-renders
function MyComponent() {
  const user = useAppStore((state) => state.user);
  return <div>{user?.name}</div>;
}
```

**Local state with useState for component-local data:**

```typescript
// ✅ GOOD: Local state for form
function LoginForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    // Use email and password
  };
```

See [Zustand patterns guide](references/ZUSTAND.md) for detailed store patterns, async operations, middleware, and testing.

return <form onSubmit={handleSubmit}>...</form>;
}

````

### 7. Styling with Tailwind

**Use Tailwind utility classes:**

```typescript
// ✅ GOOD: Tailwind classes
function Card(): JSX.Element {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
      <h2 className="text-lg font-semibold">Title</h2>
    </div>
  );
}

// ✅ GOOD: Dynamic classes with clsx if needed
import { clsx } from "clsx";

function Badge({ variant }: { variant: "primary" | "secondary" }): JSX.Element {
  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-sm font-medium",
        variant === "primary"
          ? "bg-blue-500 text-white"
          : "bg-gray-100 text-gray-700",
      )}
    >
      Badge
    </span>
  );
}
````

## Common Pitfalls

### ❌ Removing manual optimizations when migrating to React Compiler

```typescript
// BAD: Keep useCallback when migrating
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

// GOOD: Remove manual memoization
function handleClick() {
  console.log("clicked");
}
```

### ❌ Stale closures in event handlers

```typescript
// BAD: userId is captured at component creation
function UserCard({ userId }: { userId: string }) {
  const handleDelete = () => {
    deleteUser(userId); // Stale userId!
  };

  return <button onClick={handleDelete}>Delete</button>;
}

// GOOD: userId is passed when event fires
function UserCard({ userId }: { userId: string }): JSX.Element {
  return (
    <button onClick={() => deleteUser(userId)}>
      Delete
    </button>
  );
}
```

### ❌ Missing ReactElement import (not needed!)

```typescript
// BAD: Unnecessary import
import type { ReactElement } from "react";

function MyComponent(): ReactElement {
  return <div>content</div>;
}

// GOOD: ReactElement is ambient (globally available)
function MyComponent() {
  return <div>content</div>;
}
```

## Deep Reference

For detailed technical reference on React Compiler behavior, hook patterns, state management with Zustand, Tailwind styling, and component composition patterns, see [the reference guide](references/REFERENCE.md).

## Validation Commands

```bash
# Type check
npx tsc -b .

# Lint (includes React/Compiler rules)
npm run lint

# Unit tests
npm run test:unit

# Check for manual memoization (use sparingly)
grep -r "useMemo\|useCallback\|memo(" react/src --include="*.tsx"
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed React patterns
- Zustand patterns: [references/ZUSTAND.md](references/ZUSTAND.md) - Complete state management guide
- React Compiler docs: [https://react.dev](https://react.dev)
- React Hooks guide: [https://react.dev/reference/react/hooks](https://react.dev/reference/react/hooks)
- TypeScript + React: [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Project rules: [.agent/rules.md](../../../.agent/rules.md)
- TypeScript conventions: [typescript-conventions skill](../typescript-conventions/SKILL.md)
