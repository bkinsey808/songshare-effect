---
name: typescript-conventions
description: TypeScript conventions (strict typing, no `any`, JSDoc rules). Use when authoring new modules, utilities, or reviewing PRs for typing issues.
license: MIT
compatibility: TypeScript 5.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# TypeScript Conventions Skill

## What This Skill Does

Captures TypeScript best practices tailored to this repository:

- **Strict typing** - Avoid `any`, use `unknown` when unsure
- **Type declarations** - Prefer `type` over `interface` in most cases
- **Explicit return types** - Always specify function return types
- **JSDoc conventions** - Document without repeating types
- **Union types** - Use for constrained string/number values
- **Ambient types** - Know which types are globally available

## When to Use

- Authoring new TypeScript modules or utility functions
- Reviewing PRs for typing and type safety issues
- Setting up typed APIs or service layers
- Working with strict tsconfig settings

## Key Rules

### 1. Avoid `any`

```typescript
// ❌ BAD
function processData(data: any) {
  return data.value; // Type unknown, no safety
}

// ✅ GOOD
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as Record<string, unknown>).value;
  }
  throw new Error("Invalid data");
}
```

### 2. Prefer `type` Over `interface`

For most cases, use `type` declarations:

```typescript
// ✅ GOOD: type for object shapes
type User = {
  id: string;
  name: string;
  email: string;
};

// ✅ GOOD: type for unions
type Role = "admin" | "user" | "guest";

// ✅ GOOD: type for function signatures
type FetchUser = (id: string) => Promise<User>;

// ✅ OKAY: interface when extending is needed
interface Document {
  id: string;
}
interface SongDocument extends Document {
  title: string;
}
```

### 3. Explicit Return Types

Always specify function return types:

```typescript
// ❌ BAD: Inferred return type
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ GOOD: Explicit return type
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ GOOD: Effect-TS return types
function validateSong(data: unknown): Effect.Effect<Song, ValidationError> {
  return Schema.decodeUnknown(SongSchema)(data);
}
```

### 4. JSDoc Without Types

Document functions clearly without repeating TypeScript types in comments:

```typescript
// ❌ BAD: Types duplicated in JSDoc
/**
 * @param userId - The user ID (string)
 * @param options - The options object ({Object})
 * @returns - The user data (Promise<User>)
 */
function fetchUser(userId: string, options?: FetchOptions): Promise<User> {
  // ...
}

// ✅ GOOD: JSDoc describes purpose, types already in code
/**
 * Fetch user data by ID with optional caching behavior.
 *
 * @param userId - The ID of the user to fetch
 * @param options - Optional caching and timeout settings
 * @returns - User object with profile information
 */
function fetchUser(userId: string, options?: FetchOptions): Promise<User> {
  // ...
}
```

### 5. Union Types for Constrained Values

```typescript
// ❌ BAD: String type with no constraints
type Status = string;

function setStatus(status: Status) {
  // Could be anything - no validation
}

// ✅ GOOD: Union type with specific values
type Status = "pending" | "active" | "completed" | "failed";

function setStatus(status: Status) {
  // Type-safe - only valid values allowed
}
```

### 6. Ambient Types

Some types don't need to be imported (they're globally available):

```typescript
// ❌ BAD: Unnecessary import
import type { ReactElement } from "react";

function MyComponent(): ReactElement {
  return <div>content</div>;
}

// ✅ GOOD: ReactElement is ambient (globally available)
function MyComponent() {
  return <div>content</div>;
}
```

### 7. Destructure Parameters in Function Signature

Destructure object parameters directly in the function signature instead of inside the function body:

```typescript
// ❌ BAD: Destructuring inside function body
export default function runAddUserFlow(params: RunAddUserFlowParams): Effect.Effect<void> {
  const {
    username,
    lookupUserByUsername,
    addUserToLibrary,
    t,
    setUsername,
    setIsOpen,
    setIsLoading,
    setError,
  } = params;
  // ...
}

// ✅ GOOD: Destructuring in function signature
export default function runAddUserFlow({
  username,
  lookupUserByUsername,
  addUserToLibrary,
  t,
  setUsername,
  setIsOpen,
  setIsLoading,
  setError,
}: RunAddUserFlowParams): Effect.Effect<void> {
  // ...
}
```

This pattern improves clarity by making parameter requirements explicit at the function declaration.

### 8. Strict tsconfig

The project uses `strict: true` - take advantage of it:

```typescript
// ✅ GOOD: Type narrowing with strict null checks
function getUserName(user: User | null): string {
  if (!user) {
    return "Anonymous";
  }
  return user.name; // user is known to be non-null
}

// ✅ GOOD: Optional chaining in strict mode
const email = user?.profile?.email; // Safe, won't error on null/undefined
```

## Validation

Run these after editing or reviewing code:

```bash
# Type check
npx tsc -b .

# Lint
npm run lint

# Unit tests (if behavior is non-trivial)
npm run test:unit
```

## References

- Complete project rules: [.agent/rules.md](../../../.agent/rules.md)
- TypeScript strict mode: [TypeScript Handbook - Type Checking](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- TypeScript handbook: [https://www.typescriptlang.org/docs/handbook/](https://www.typescriptlang.org/docs/handbook/)
- React conventions: [react-conventions skill](../react-conventions/SKILL.md) (for React-specific typing patterns)
