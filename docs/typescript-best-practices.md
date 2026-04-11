# TypeScript Best Practices

This document captures patterns and solutions for working with strict TypeScript in this project, including const/satisfies patterns, Effect Schema, type extraction, and integration with external APIs.

> **Quick Reference**: For common lint errors, see [lint-best-practices.md](/docs/lint-best-practices.md)
> **Cursor Rule**: For concise guidance, see [.cursor/rules/lint-resolution-agent.mdc](/.cursor/rules/lint-resolution-agent.mdc)

## Table of Contents

- [Project Configuration Context](#project-configuration-context)
- [Type Definitions](#type-definitions)
  - [Required vs Optional Properties](#required-vs-optional-properties)
  - [Explicit Return Types](#explicit-return-types)
  - [Prefer Enum Alternatives](#prefer-enum-alternatives)
- [Imports](#imports)
  - [Type-Only Imports](#type-only-imports)
  - [Import Organization](#import-organization)
- [Type Safety](#type-safety)
  - [Avoid any](#avoid-any)
  - [Strict Null Checks](#strict-null-checks)
- [Naming Conventions](#naming-conventions)
  - [Type vs Interface](#type-vs-interface)
  - [Underscore Prefix for Unused Variables](#underscore-prefix-for-unused-variables)
- [Ambient Types](#ambient-types)
- [Common Integration Challenges & Solutions](#common-integration-challenges--solutions)
  - [Supabase Client Integration](#supabase-client-integration)
  - [JSON API Response Handling](#json-api-response-handling)
  - [Request Body Validation](#request-body-validation)
  - [exactOptionalPropertyTypes Handling](#exactoptionalpropertytypes-handling)
  - [Index Signature Access](#index-signature-access)
- [Type Guard Library](#type-guard-library)
  - [Basic Type Guards](#basic-type-guards)
  - [Enum/Union Type Guards](#enumunion-type-guards)
  - [Object Shape Type Guards](#object-shape-type-guards)
- [Error Handling Patterns](#error-handling-patterns)
  - [Database Errors](#database-errors)
  - [API Errors](#api-errors)
- [Advanced Patterns](#advanced-patterns)
  - [Complex Validation Chains](#complex-validation-chains)
  - [Generic Type Guards](#generic-type-guards)
  - [Effect-TS Integration](#effect-ts-integration)
- [Project-Specific Patterns](#project-specific-patterns)
  - [`as const` + `satisfies` for Validated Literal Constants](#as-const--satisfies-for-validated-literal-constants)
  - [Union Types from `as const` Arrays](#union-types-from-as-const-arrays)
  - [`Exclude` for Nullable Database Column Types](#exclude-for-nullable-database-column-types)
  - [Set-Based Union Type Guards](#set-based-union-type-guards)
  - [Type Extraction from Effect Schema](#type-extraction-from-effect-schema)
  - [Effect Schema Piping with `filter` and `annotations`](#effect-schema-piping-with-filter-and-annotations)
  - [Avoiding Redundant Type Assertions](#avoiding-redundant-type-assertions)
  - [`ReadonlyDeep` Recursive Mapped Type](#readonlydeep-recursive-mapped-type)
- [Troubleshooting Guide](#troubleshooting-guide)
  - [When Type Guards Fail](#when-type-guards-fail)
  - [Common Gotchas](#common-gotchas)
- [Quick Checklist](#quick-checklist)
- [References](#references)

---

<a id="project-configuration-context"></a>

## Project Configuration Context

This project uses extremely strict TypeScript and Oxlint/Eslint configurations:

- `exactOptionalPropertyTypes: true`
- `noPropertyAccessFromIndexSignature: true`
- `strictNullChecks: true`
- `@typescript-eslint/no-unsafe-*` rules enabled
- `@typescript-eslint/strict-boolean-expressions` enabled
- `@typescript-eslint/no-explicit-any` enabled

<a id="type-definitions"></a>

## Type Definitions

<a id="required-vs-optional-properties"></a>

### Required vs Optional Properties

With `exactOptionalPropertyTypes: true`, optional (`?`) and required-but-possibly-undefined (`T | undefined`) are genuinely different — `undefined` cannot be passed to a `?` prop. Use each deliberately:

```typescript
// ✅ Use `?` when the property can be truly omitted by callers
type Config = {
  timeout?: number;       // caller may omit this entirely
};

// ✅ Use `T | undefined` when the property must always be passed,
//    but the value may be undefined at runtime
type Props = {
  userId: string | undefined;    // must pass it, even if no user yet
  onSelect: (() => void) | undefined;
};

// ❌ Avoid: optional when the prop is always provided at every call site
//    — compiler won't catch if a caller forgets it
type Props = {
  userId?: string;
};
```

**Rule of thumb:** if every call site always passes the prop (even as `undefined`), make it required with `| undefined`. Reserve `?` for properties callers genuinely omit.

<a id="explicit-return-types"></a>

### Explicit Return Types

Always specify explicit return types on functions and React components:

```typescript
// ❌ Avoid: inferred return type
const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Preferred: explicit return type
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

For React components, use the ambient `ReactElement` (no import needed):

```typescript
// ✅ Preferred: ReactElement is ambient — no import needed
function MyComponent({ title }: Props): ReactElement {
  return <div>{title}</div>;
}

// ❌ Avoid: importing ReactElement
import type { ReactElement } from "react"; // unnecessary

// ❌ Avoid: JSX.Element (less precise)
function MyComponent(): JSX.Element { ... }
```

<a id="prefer-enum-alternatives"></a>

### Prefer Enum Alternatives

Avoid TypeScript `enum`. Use string union types or `as const` arrays instead:

```typescript
// ✅ Preferred: string union type
type Status = "pending" | "accepted" | "rejected";

// ✅ Preferred: as const array → union (single source of truth)
const STATUSES = ["pending", "accepted", "rejected"] as const;
type Status = (typeof STATUSES)[number];

// ✅ Preferred: as const object for named constants with runtime access
const Direction = {
  UP: "up",
  DOWN: "down",
} as const satisfies Record<string, string>;
type Direction = (typeof Direction)[keyof typeof Direction];

// ❌ Avoid: enum
enum Status {
  Pending = "pending",
  Accepted = "accepted",
}
```

See [Union Types from `as const` Arrays](#union-types-from-as-const-arrays) and [`as const` + `satisfies`](#as-const--satisfies-for-validated-literal-constants) for the full project pattern.

<a id="imports"></a>

## Imports

<a id="type-only-imports"></a>

### Type-Only Imports

Use `import type { ... }` when all imports from a module are types. Use inline `type` keyword when mixing types and values:

```typescript
// ✅ Preferred: import type when all imports are types
import type { EventFormValues, SaveEventRequest } from "../event-types";
import type { ReactNode } from "react";

// ✅ Valid: inline type for mixed imports (some values, some types)
import { useState, type ReactNode } from "react";
import { Schema, type Effect } from "effect";

// ❌ Avoid: inline type when all imports are types
import { type EventFormValues, type SaveEventRequest } from "../event-types";
```

<a id="import-organization"></a>

### Import Organization

Group imports in this order, with a blank line between groups:

```typescript
// 1. External libraries
import { useState, useRef } from "react";
import { Effect, Schema } from "effect";
import { useNavigate } from "react-router-dom";

// 2. Internal aliases (@/react, @/api, @/shared)
import useAppStore from "@/react/app-store/useAppStore";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

// 3. Relative imports
import type { SongFormValues } from "../song-form-types";
import useCollapsibleSections from "./useCollapsibleSections";
```

Use absolute `@/` alias imports rather than deep relative paths (`../../..`). Alphabetize within groups.

<a id="type-safety"></a>

## Type Safety

<a id="avoid-any"></a>

### Avoid `any`

Never use `any`. Use `unknown` for values whose type is truly unknown, and narrow with type guards:

```typescript
// ❌ Avoid: any disables type checking
const process = (value: any) => value.toUpperCase();

// ✅ Preferred: unknown + type guard
const process = (value: unknown): string => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  throw new Error("Expected string");
};

// ✅ Preferred: specific type
const process = (data: { value: string }): string => data.value;
```

<a id="strict-null-checks"></a>

### Strict Null Checks

`strictNullChecks` is enabled. Always handle `null` and `undefined` explicitly:

```typescript
// ❌ Avoid: assuming value is defined
const getName = (user: User | undefined) => user.name; // TypeScript error

// ✅ Preferred: explicit guard
const getName = (user: User | undefined): string => {
  if (user === undefined) {
    return "Unknown";
  }
  return user.name;
};

// ✅ Preferred: optional chaining + nullish coalescing
const getName = (user: User | undefined): string => user?.name ?? "Unknown";
```

<a id="naming-conventions"></a>

## Naming Conventions

<a id="type-vs-interface"></a>

### Type vs Interface

Prefer `type` over `interface` for consistency:

```typescript
// ✅ Preferred: type alias
type UserProps = {
  name: string;
  email: string;
};

// ❌ Avoid: interface for plain object shapes
interface UserProps {
  name: string;
  email: string;
}
```

Use `interface` only when extending built-in or external types:

```typescript
// ✅ Valid: extending a browser API type
interface AudioTrack extends MediaStreamTrack {
  gainNode: GainNode;
}
```

<a id="underscore-prefix-for-unused-variables"></a>

### Underscore Prefix for Unused Variables

Prefix unused variables with `_` to satisfy the `no-unused-vars` rule. Remove the prefix if the variable becomes used:

```typescript
// ✅ Unused capture in destructuring — prefix with _
const { data, _metadata } = useQuery(); // _metadata not used

// ✅ Unused parameter required for interface conformance
function handler(_event: MouseEvent, value: string): void {
  doSomething(value);
}

// ❌ Remove prefix once a variable is used
const { data, _name } = useQuery();
return <div>{_name}</div>; // should be `name`, not `_name`
```

<a id="ambient-types"></a>

## Ambient Types

`ReactElement` is declared as a global ambient type — never import it. `ReactNode` must be imported:

```typescript
// ❌ Avoid: importing ReactElement (it's ambient)
import type { ReactElement, ReactNode } from "react";

// ✅ Preferred: only import ReactNode
import type { ReactNode } from "react";

function MyComponent({ children }: { children: ReactNode }): ReactElement {
  return <div>{children}</div>;
}
```

<a id="common-integration-challenges--solutions"></a>

## Common Integration Challenges & Solutions

<a id="supabase-client-integration"></a>

### 1. Supabase Client Integration

**Challenge**: Supabase client methods return `any` types, causing unsafe assignment errors.

**Solution**: Use type guards and explicit typing:

```typescript
// Type guard for Supabase results
function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
	return typeof value === "object" && value !== null && "data" in value && "error" in value;
}

// Usage pattern
const result: unknown = await supabaseQuery;
if (!isSupabaseResult(result)) {
	throw new Error("Invalid Supabase result");
}

const { data, error } = result;
if (error !== null && error !== undefined) {
	throw new Error(error instanceof Error ? error.message : "Database query failed");
}
```

<a id="json-api-response-handling"></a>

### 2. JSON API Response Handling

**Challenge**: `res.json()` returns `any`, requiring safe type assertions.

**Solution**: Type guards with validation:

```typescript
// Generic API response type guard
function isApiResponse<T>(
	value: unknown,
	dataValidator: (data: unknown) => data is T,
): value is { data: T } {
	return (
		typeof value === "object" &&
		value !== null &&
		"data" in value &&
		dataValidator((value as { data: unknown }).data)
	);
}

// Usage
const jsonData: unknown = await res.json();
if (!isApiResponse(jsonData, isUserArray)) {
	throw new Error("Invalid API response format");
}
const { data } = jsonData;
```

<a id="request-body-validation"></a>

### 3. Request Body Validation

**Challenge**: Request bodies from HTTP handlers are `unknown` and need validation.

**Solution**: Comprehensive validation with type guards:

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidItemType(value: unknown): value is "song" | "playlist" | "event" {
	return typeof value === "string" && ["song", "playlist", "event"].includes(value);
}

function extractCreateRequest(request: unknown): CreateRequest {
	if (!isRecord(request)) {
		throw new TypeError("Request must be an object");
	}

	const { item_type, name } = request;

	if (typeof name !== "string") {
		throw new TypeError("name must be a string");
	}

	if (!isValidItemType(item_type)) {
		throw new TypeError("item_type must be one of: song, playlist, event");
	}

	return { item_type, name };
}
```

<a id="exactoptionalpropertytypes-handling"></a>

### 4. exactOptionalPropertyTypes Handling

**Challenge**: Optional properties can't receive `T | undefined`, only `T` or omission.

**Solution**: Conditional spread pattern:

```typescript
// ❌ FAILS: passes `string | undefined` where `string?` expected
function MyComponent({ optionalProp }: { optionalProp?: string }) {
  return <ChildComponent optionalProp={optionalProp} />; // Type error!
}

// ✅ GOOD: conditional spread (no-negated-condition safe form)
function MyComponent({ optionalProp }: { optionalProp?: string }) {
  return (
    <ChildComponent
      {...(optionalProp === undefined ? {} : { optionalProp })}
    />
  );
}
```

For UI-specific best-practices (component props, prop patterns, and React conventions), see [docs/client/react-best-practices.md](/docs/client/react-best-practices.md).

<a id="index-signature-access"></a>

### 5. Index Signature Access

**Challenge**: `noPropertyAccessFromIndexSignature` requires bracket notation.

**Solution**: Use bracket notation with proper null checks:

```typescript
// ❌ BAD: Dot notation on index signature
function processObject(obj: Record<string, unknown>) {
	return obj.someProperty; // Error!
}

// ✅ GOOD: Bracket notation with validation
function processObject(obj: Record<string, unknown>) {
	const value = obj["someProperty"];
	return value !== null && value !== undefined ? value : "default";
}
```

<a id="type-guard-library"></a>

## Type Guard Library

<a id="basic-type-guards"></a>

### Basic Type Guards

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
	return typeof value === "string";
}

function isNumber(value: unknown): value is number {
	return typeof value === "number" && !Number.isNaN(value);
}
```

<a id="enumunion-type-guards"></a>

### Enum/Union Type Guards

```typescript
function isValidStatus(value: unknown): value is "pending" | "accepted" | "rejected" {
	return typeof value === "string" && ["pending", "accepted", "rejected"].includes(value);
}
```

For large union types, prefer [Set-Based Union Type Guards](#set-based-union-type-guards).

<a id="object-shape-type-guards"></a>

### Object Shape Type Guards

```typescript
function hasId(obj: unknown): obj is { id: string } {
	return isRecord(obj) && typeof obj["id"] === "string";
}

function hasRequiredUserFields(obj: unknown): obj is { id: string; email: string } {
	return isRecord(obj) && typeof obj["id"] === "string" && typeof obj["email"] === "string";
}
```

<a id="error-handling-patterns"></a>

## Error Handling Patterns

<a id="database-errors"></a>

### Database Errors

```typescript
function handleDatabaseError(error: unknown): never {
	if (error instanceof Error) {
		throw new DatabaseError({ message: error.message });
	}
	throw new DatabaseError({ message: "Unknown database error" });
}
```

<a id="api-errors"></a>

### API Errors

```typescript
function handleApiError(error: unknown): never {
	const message = error instanceof Error ? error.message : "API request failed";
	throw new Error(message);
}
```

<a id="advanced-patterns"></a>

## Advanced Patterns

<a id="complex-validation-chains"></a>

### Complex Validation Chains

For complex objects with nested validation:

```typescript
function isValidUserWithProfile(value: unknown): value is UserWithProfile {
	return (
		isRecord(value) &&
		typeof value["id"] === "string" &&
		typeof value["email"] === "string" &&
		isRecord(value["profile"]) &&
		typeof value["profile"]["name"] === "string"
	);
}
```

<a id="generic-type-guards"></a>

### Generic Type Guards

For reusable validation patterns:

```typescript
function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
	return isRecord(obj) && key in obj;
}

function isArrayOf<T>(value: unknown, itemValidator: (item: unknown) => item is T): value is T[] {
	return Array.isArray(value) && value.every(itemValidator);
}
```

<a id="effect-ts-integration"></a>

### Effect-TS Integration

Use Effect Schema for validation instead of manual type guards where possible:

```typescript
import { Effect, Schema } from "effect";

const UserSchema = Schema.Struct({
	id: Schema.String,
	email: Schema.String,
	name: Schema.optional(Schema.String),
});

function validateUser(data: unknown): Effect.Effect<User, ValidationError> {
	return Schema.decodeUnknown(UserSchema)(data);
}
```

<a id="project-specific-patterns"></a>

## Project-Specific Patterns

<a id="as-const--satisfies-for-validated-literal-constants"></a>

### `as const` + `satisfies` for Validated Literal Constants

Use `as const satisfies Type` to get both literal inference and compile-time shape validation. This is the primary pattern for config objects and option arrays in this codebase.

```typescript
// react/src/tag/item-type.ts
export const ITEM_TYPES = ["song", "playlist", "event", "community", "image"] as const;

export const ITEM_TYPE_CONFIG = {
	song: { tagTable: "song_tag", idCol: "song_id", libraryTable: "song_library" },
	playlist: { tagTable: "playlist_tag", idCol: "playlist_id", libraryTable: "playlist_library" },
	// ...
} as const satisfies Record<ItemType, { tagTable: string; idCol: string; libraryTable: string }>;
```

- `as const` — preserves string literal types and makes all properties `readonly`
- `satisfies Type` — validates the shape at compile time without widening the inferred type
- Without `satisfies`, a typo in a key would only fail at runtime; with it, TypeScript catches it immediately

<a id="union-types-from-as-const-arrays"></a>

### Union Types from `as const` Arrays

Derive a union type directly from a `const` array using `(typeof ARRAY)[number]`. This keeps the type and the allowed values as a single source of truth.

```typescript
// react/src/tag/item-type.ts
export const ITEM_TYPES = ["song", "playlist", "event", "community", "image"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
// → type ItemType = "song" | "playlist" | "event" | "community" | "image"
```

Adding or removing a value from `ITEM_TYPES` automatically updates the union type and any exhaustiveness checks downstream.

<a id="exclude-for-nullable-database-column-types"></a>

### `Exclude` for Nullable Database Column Types

Database columns typed as `string | null` in generated Supabase types can be narrowed to just `string` using `Exclude`:

```typescript
// shared/src/song/songKeyOptions.ts
import type { Database } from "@/shared/generated/supabaseTypes";

type SongKey = Exclude<Database["public"]["Tables"]["song_public"]["Row"]["key"], null>;
// → type SongKey = string (non-nullable version of the DB column)
```

This avoids manually duplicating the allowed values — if the DB column type changes, `SongKey` updates automatically.

<a id="set-based-union-type-guards"></a>

### Set-Based Union Type Guards

For large union types, a `Set` lookup is more efficient and readable than an `includes` chain:

```typescript
// shared/src/song/songKeyOptions.ts
const songKeySet = new Set<string>(songKeys);

function isSongKey(value: unknown): value is SongKey {
	return typeof value === "string" && songKeySet.has(value);
}
```

The `Set` is constructed once at module load time and reused. This also avoids the `Array.includes` type-widening issue where TypeScript requires the argument type to match the array element type.

<a id="type-extraction-from-effect-schema"></a>

### Type Extraction from Effect Schema

Use `Schema.Schema.Type<typeof schema>` to derive the TypeScript type from a schema definition. The schema is the single source of truth for both runtime validation and compile-time types.

```typescript
// react/src/song/song-schema.ts
import { Schema } from "effect";

const slideSchema = Schema.Struct({
	slide_name: Schema.String,
	field_data: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export type Slide = Schema.Schema.Type<typeof slideSchema>;
// → type Slide = { readonly slide_name: string; readonly field_data: { readonly [x: string]: string } }
```

Never write the type manually alongside the schema — always extract it with `Schema.Schema.Type`.

<a id="effect-schema-piping-with-filter-and-annotations"></a>

### Effect Schema Piping with `filter` and `annotations`

Compose schema validation rules with `.pipe()` and attach i18n message metadata with `Schema.annotations()` and a unique symbol key:

```typescript
// react/src/song/song-schema.ts
export const songMessageKey: unique symbol = Symbol.for("@songshare/song-message-key");

export const songNameSchema: Schema.Schema<string> = Schema.String.pipe(
	Schema.filter((value) => value.trim() === value, {
		message: () => "song.validation.noLeadingTrailingSpaces",
	}),
	Schema.annotations({ [songMessageKey]: { key: "song.validation.noLeadingTrailingSpaces" } }),
	Schema.filter((value) => value.length >= 2 && value.length <= 100, {
		message: () => "song.validation.nameLength",
	}),
	Schema.annotations({ [songMessageKey]: { key: "song.validation.nameLength" } }),
);
```

`unique symbol` prevents collisions with other annotation keys across modules.

<a id="avoiding-redundant-type-assertions"></a>

### Avoiding Redundant Type Assertions

Prefer an explicit type annotation on the receiving variable over an inline `as` cast. The annotation is sufficient and does not suppress type errors the way `as` can.

```typescript
// ❌ BAD: redundant — `raw` annotation already widens any to unknown
const raw: unknown = await (response.json() as Promise<unknown>);

// ✅ GOOD: the explicit variable annotation handles it
const raw: unknown = await response.json();

// ❌ BAD: same issue inside Effect.tryPromise
Effect.tryPromise({ try: () => response.json() as Promise<unknown>, catch: ... })

// ✅ GOOD
const raw: unknown = yield* $(Effect.tryPromise({ try: () => response.json(), catch: ... }))
```

Reserve `as SomeType` for genuine narrowings where TypeScript cannot infer the type (e.g. after a runtime discriminant check).

<a id="readonlydeep-recursive-mapped-type"></a>

### `ReadonlyDeep` Recursive Mapped Type

`shared/src/types/ReadonlyDeep.type.ts` provides a `ReadonlyDeep<T>` utility that recursively marks all nested properties as `readonly` while preserving function signatures and preventing infinite recursion via a depth-limit tuple:

```typescript
// Usage
import type { ReadonlyDeep } from "@/shared/types/ReadonlyDeep.type";

type ImmutableConfig = ReadonlyDeep<MyConfig>;
```

Key implementation details:
- Functions are detected with `(...args: readonly unknown[]) => unknown` and left unchanged
- Arrays become `readonly Item[]`; `Map`/`Set` become `ReadonlyMap`/`ReadonlySet`
- Recursion depth is capped at 5 using a `_Prev` tuple to avoid TS instantiation errors on complex ambient types (e.g. Hono `Context`)

<a id="troubleshooting-guide"></a>

## Troubleshooting Guide

<a id="when-type-guards-fail"></a>

### When Type Guards Fail

1. **Check for null/undefined**: Always handle these cases explicitly
2. **Array vs Object**: Use `Array.isArray()` to distinguish
3. **Nested Properties**: Validate each level separately
4. **Union Types**: Create separate guards for each variant

<a id="common-gotchas"></a>

### Common Gotchas

1. **`typeof null === 'object'`**: Always check `value !== null`
2. **Empty arrays are truthy**: Use `array.length > 0` if needed
3. **NaN is a number**: Use `Number.isNaN()` for validation
4. **`new Set(undefined)`**: Valid and produces an empty set — no `?? []` needed
5. **Prototype pollution**: Be careful with `in` operator

<a id="quick-checklist"></a>

## Quick Checklist

When creating or reviewing TypeScript code:

- [ ] Explicit return types on all functions and components
- [ ] `ReactElement` not imported (ambient); `ReactNode` imported when needed
- [ ] `import type { ... }` when all imports from a module are types; inline `type` for mixed imports
- [ ] No `any` — use specific types or `unknown` with type guards
- [ ] `null`/`undefined` handled explicitly (optional chaining, nullish coalescing, guards)
- [ ] `type` used instead of `interface` (unless extending external/browser types)
- [ ] Unused variables prefixed with `_`; prefix removed when variable becomes used
- [ ] Optional props (`?`) only when truly omittable; `T | undefined` when always passed
- [ ] `enum` avoided — use string union types or `as const` arrays instead
- [ ] Redundant `as Type` casts removed — prefer explicit variable annotations
- [ ] Config objects use `as const satisfies Type` for validated literal inference
- [ ] Types derived from schemas via `Schema.Schema.Type<typeof schema>`, not written manually

<a id="references"></a>

## References

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)
- [Effect-TS Schema](https://effect.website/docs/schema/introduction/)
