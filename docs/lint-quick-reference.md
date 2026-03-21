# Lint Error Quick Reference

Quick solutions for the most common lint errors in this strict TypeScript project.

Run `npm run lint` to check everything. Run `npx tsc -b . --noEmit` for type-only checks.

---

## API Handler Patterns

### `no-unsafe-type-assertion` — request validation

Never cast `request as Record<string, unknown>`. Use `decodeUnknownSyncOrThrow` with a schema instead:

```typescript
// ❌ BAD — triggers no-unsafe-type-assertion
const body = request as Record<string, unknown>;
const tag_slug = body.tag_slug as string;

// ✅ GOOD — schema validates and types at once
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { mySchema } from "@/shared/validation/mySchemas";

export default function extractMyRequest(request: unknown): MyRequest {
  return decodeUnknownSyncOrThrow(mySchema, request);
}
```

Schemas live in `shared/src/validation/`, not in `api/src/`.

### `no-unsafe-assignment` / `no-unsafe-call` / `no-unsafe-member-access` — dynamic Supabase tables

Never cast the Supabase client to `any`. Use a typed `if/else` chain per table:

```typescript
// ❌ BAD — triggers all three rules
const anyClient = client as any;
anyClient.from(dynamicTable).select("user_id");

// ✅ GOOD — typed if/else per item type
if (itemType === "song") {
  const result = yield* $(Effect.tryPromise({
    try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
    catch: (error) => new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
  }));
  return result.data.user_id;
} else if (itemType === "playlist") {
  // ...
}
```

See `api/src/tags/getTagItemOwner.ts` for the canonical multi-type example.

### "All if-else branches contain same code" — Supabase error check

Supabase returns errors in the response object, not as exceptions. Checking `result.error` identically at the end of every branch duplicates code. Throw inside `try` so `catch` handles everything:

```typescript
// ❌ BAD — repeated error check, lint flags duplicate branch endings
const result = yield* $(Effect.tryPromise({
  try: () => client.from("...").insert([...]),
  catch: ...
}));
if (result.error) {
  return yield* $(Effect.fail(new DatabaseError({ ... })));
}

// ✅ GOOD — throw inside try; one catch handles all errors
yield* $(Effect.tryPromise({
  try: async () => {
    const result = await client.from("my_table").insert([{ ... }]);
    if (result.error) { throw result.error; }
  },
  catch: (error: unknown) =>
    new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
}));
```

### `SupabaseFromLike` optional method chain — use `callSelect`

`SupabaseClientLike.from().select()` returns `{ order?: ..., eq?: ... }` with optional methods. Calling `.order()` directly on this triggers TS2722 "Cannot invoke an object which is possibly 'undefined'".

Use the `callSelect` helper which handles the chain safely:

```typescript
// ❌ BAD — .order() is optional on the SupabaseFromLike type
try: () => client.from("tag_library").select("user_id, tag_slug").order("tag_slug"),

// ✅ GOOD — callSelect wraps the chain safely
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";

try: () => callSelect<TagLibraryEntry>(client, "tag_library", {
  cols: "user_id, tag_slug",
  order: "tag_slug",
}),
```

---

## General TypeScript / ESLint Rules

### `id-length` — variable names too short

oxlint requires identifiers of at least 2 characters. Query params are a common trap:

```typescript
// ❌ BAD
const q = ctx.req.query("q");
const r = ctx.req.query("limit");

// ✅ GOOD
const searchQuery = ctx.req.query("q") ?? "";
const limitParam = ctx.req.query("limit");
```

### `no-magic-numbers`

Extract numeric literals into named constants:

```typescript
// ❌ BAD
if (parsedLimit <= 0) { ... }

// ✅ GOOD
const MIN_LIMIT = 1;
const DEFAULT_LIMIT = 10;
if (parsedLimit < MIN_LIMIT) { ... }
```

### `no-negated-condition`

Put the positive case first in ternaries and if/else:

```typescript
// ❌ BAD
const safeLimit = parsedLimit !== undefined ? parsedLimit : DEFAULT_LIMIT;

// ✅ GOOD
const safeLimit = parsedLimit === undefined ? DEFAULT_LIMIT : parsedLimit;
```

### `prefer-number-properties`

Use `Number.*` static methods, not globals:

```typescript
// ❌ BAD
parseInt(limitParam, 10);
isNaN(parsedLimit);

// ✅ GOOD
Number.parseInt(limitParam, 10);
Number.isNaN(parsedLimit);
```

### `curly` — always use braces

```typescript
// ❌ BAD
if (result.error) throw result.error;

// ✅ GOOD
if (result.error) { throw result.error; }
```

### `consistent-type-imports` — type-only imports

```typescript
// ❌ BAD — value import used only as a type
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
// (used only as: ReturnType<typeof getSupabaseServerClient>)

// ✅ GOOD
import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
```

### `--isolatedDeclarations` — explicit type annotations on exports

When `isolatedDeclarations` is enabled, TypeScript cannot infer exported types from complex expressions. Always annotate exported schemas:

```typescript
// ❌ BAD — type cannot be inferred under isolatedDeclarations
export const mySchema = Schema.Literal("a", "b", "c");

// ✅ GOOD — explicit annotation
export const mySchema: Schema.Schema<"a" | "b" | "c", "a" | "b" | "c"> =
  Schema.Literal("a", "b", "c");
```

### `no-unsafe-type-assertion` — general code (non-API)

For non-API code where a runtime type guard is more appropriate than a schema:

```typescript
// ❌ BAD
const data = response as UserData;

// ✅ GOOD
function isUserData(value: unknown): value is UserData {
  return typeof value === "object" && value !== null && "id" in value;
}
if (!isUserData(response)) { throw new Error("Invalid data"); }
const data = response;
```

### `strict-boolean-expressions`

```typescript
// ❌ BAD — implicit truthiness
if (nullableString) { }

// ✅ GOOD — explicit check
if (nullableString !== null && nullableString !== undefined) { }
```

### `exactOptionalPropertyTypes`

```typescript
// ❌ BAD
<Component optionalProp={maybeUndefined} />

// ✅ GOOD — conditional spread
<Component {...(maybeUndefined !== undefined && { optionalProp: maybeUndefined })} />
```

### `init-declarations`

```typescript
// ❌ BAD
let query: unknown;

// ✅ GOOD
let query: unknown = undefined;
```

### `no-confusing-void-expression`

```typescript
// ❌ BAD
onClick={() => setLoading(true)}

// ✅ GOOD
onClick={() => { setLoading(true); }}
```

### `consistent-function-scoping`

```typescript
// ❌ BAD — inner function recreated on every call
function parent() {
  function helper() { return true; }
  return helper;
}

// ✅ GOOD — move to module scope
function helper() { return true; }
function parent() { return helper; }
```

---

## Unicorn Rules

### `unicorn/no-array-sort` — use `toSorted()`

`Array#sort()` mutates the original array. Use `toSorted()` instead:

```typescript
// ❌ BAD
const sorted = items.sort();

// ✅ GOOD
const sorted = items.toSorted();
```

### `unicorn/catch-error-name` — name catch parameter `error`

```typescript
// ❌ BAD
} catch (err: unknown) {
  console.error("Failed:", err);
}

// ✅ GOOD
} catch (error: unknown) {
  console.error("Failed:", error);
}
```

---

## Project-Specific Rules

### `require-useeffect-comment` — comment before `useEffect`

Every `useEffect` call must be preceded by a comment explaining its purpose:

```typescript
// ❌ BAD
useEffect(() => {
  void fetchData();
}, [fetchData]);

// ✅ GOOD
// Fetch data on mount and re-fetch when the location changes.
useEffect(() => {
  void fetchData();
}, [fetchData]);
```

### `oxc/no-barrel-file` — no index re-exports

Import directly from source files. No `index.ts` barrel files:

```typescript
// ❌ BAD
import { Song } from "@/shared/generated";

// ✅ GOOD
import type { Song } from "@/shared/generated/database.types";
```

---

## Essential Type Guards

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isSupabaseResult(value: unknown): value is { data: unknown; error: unknown } {
  return isRecord(value) && "data" in value && "error" in value;
}
```

---

## Quick Reference Table

| Rule | ❌ Wrong | ✅ Right |
|------|----------|----------|
| `id-length` | `const q = ...` | `const searchQuery = ...` |
| `no-unsafe-type-assertion` (API) | `request as Record<...>` | `decodeUnknownSyncOrThrow(schema, request)` |
| `no-unsafe-assignment` / `no-unsafe-call` | `(client as any).from(...)` | Typed `if/else` chain per table |
| Duplicate Supabase branch endings | `if (result.error) {...}` in every branch | Throw inside `try`; one `catch` |
| `SupabaseFromLike` optional chain | `.select().order(...)` | `callSelect(..., { order: ... })` |
| `no-magic-numbers` | `limit <= 0` | `const MIN = 1; limit < MIN` |
| `no-negated-condition` | `x !== undefined ? a : b` | `x === undefined ? b : a` |
| `prefer-number-properties` | `parseInt(x, 10)` | `Number.parseInt(x, 10)` |
| `consistent-type-imports` | `import Foo from "..."` (type only) | `import type Foo from "..."` |
| `curly` | `if (x) throw err;` | `if (x) { throw err; }` |
| `isolatedDeclarations` | `export const s = Schema.Literal(...)` | `export const s: Schema.Schema<...> = ...` |
| `no-array-sort` | `.sort()` | `.toSorted()` |
| `catch-error-name` | `catch (err)` | `catch (error)` |
| `require-useeffect-comment` | bare `useEffect(...)` | comment above `useEffect(...)` |
| `no-null` | `JSON.stringify(x, null, 2)` | avoid `null` literals |

---

## Quick Commands

```bash
npm run lint                        # full suite: tsc + oxlint + eslint
npx tsc -b . --noEmit               # type-check only
npx tsc -p api/tsconfig.json --noEmit  # type-check API only
npm run format                      # format with oxfmt
```

## Further Reading

- [Linting and Formatting](./linting-and-formatting.md) — tools, config, workflows
- [Strict TypeScript Patterns](./strict-typescript-patterns.md) — deeper type safety guidance
- [Add API Endpoint workflow](../.agent/workflows/add-api-endpoint.md) — lint-safe API patterns
