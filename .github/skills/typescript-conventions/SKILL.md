---
name: typescript-conventions
description: TypeScript conventions for this repo (strict typing, no `any`, JSDoc rules, exactOptionalPropertyTypes, ambient types). Use when authoring or editing any TypeScript or TSX file.
license: MIT
compatibility: TypeScript 5.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# TypeScript Conventions Skill

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

### 4. Ambient Types

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

### 5. Destructure Parameters in Function Signature

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

### 6. `exactOptionalPropertyTypes` — Threading Optional Props

The project enables `exactOptionalPropertyTypes` in `tsconfig`. This means an optional property `foo?: T` **cannot** receive a value of type `T | undefined` — only `T` or absence.

This bites when you thread an optional prop through a component into a hook or child:

```typescript
// ❌ FAILS: passes `readonly string[] | undefined` where `readonly string[]` expected
function MyInput({ excludeIds }: { excludeIds?: readonly string[] }): ReactElement {
  const result = useMyHook({ excludeIds }); // type error!
  // ...
}
```

**Fix — conditional spread pattern:**

```typescript
// ✅ GOOD: only includes the key when the value is defined
function MyInput({ excludeIds }: { excludeIds?: readonly string[] }): ReactElement {
  const result = useMyHook({
    baseArg: "value",
    ...(excludeIds === undefined ? {} : { excludeIds }),
  });
  // ...
}
```

This pattern omits the key entirely when the value is `undefined`, satisfying `exactOptionalPropertyTypes`. Use it any time you thread an optional prop from a component into a hook or nested call.

**Same pattern for Supabase updates with nullable values (`no-null` rule):**

```typescript
// When clearing a nullable FK column, disable no-null on that specific line
yield* $(Effect.tryPromise({
  try: () =>
    supabase
      .from("community_public")
      .update({
        // oxlint-disable-next-line no-null
        active_event_id: null,
      })
      .eq("community_id", community_id)
      .eq("active_event_id", event_id),
  catch: (err) => new DatabaseError({ message: extractErrorMessage(err) }),
}));
```

### 7. Strict Null Checks — `Set` Construction from Optional Arrays

`new Set(undefined)` is valid in TypeScript and produces an empty set, so you do **not** need a `?? []` fallback when constructing a `Set` from an optional array:

```typescript
// ❌ triggers oxlint no-useless-undefined / unnecessary empty array
const excludeSet = new Set(optionalArray ?? []);

// ✅ GOOD: new Set(undefined) === new Set([])
const excludeSet = new Set(optionalArray);
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
- JSDoc conventions: [code-comments skill](../code-comments/SKILL.md)
- React conventions: [react-conventions skill](../react-conventions/SKILL.md) (for React-specific typing patterns)
- TypeScript handbook: [https://www.typescriptlang.org/docs/handbook/](https://www.typescriptlang.org/docs/handbook/)
