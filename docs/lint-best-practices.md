# Lint Best Practices

This document is the main reference for linting and formatting in this repo.
It combines the tooling and workflow guidance with the most common lint-error
fix patterns used in this strict TypeScript project.

## Table of Contents

- [Tooling and Config](#tooling-and-config)
- [Commands and Workflow](#commands-and-workflow)
- [Core Practices](#core-practices)
- [API Handler Patterns](#api-handler-patterns)
- [General TypeScript and ESLint Rules](#general-typescript-and-eslint-rules)
- [Unicorn Rules](#unicorn-rules)
- [Project-Specific Rules](#project-specific-rules)
- [Essential Type Guards](#essential-type-guards)
- [Quick Reference Table](#quick-reference-table)
- [Troubleshooting](#troubleshooting)
- [PR Checklist](#pr-checklist)
- [Prompting Agents](#prompting-agents)
- [See Also](#see-also)

<a id="tooling-and-config"></a>

## Tooling and Config

The repo uses these tools together:

- `oxfmt` for formatting, configured in `.oxfmtrc.json`
- `oxlint` for linting, configured in `.oxlintrc.json`
- `lint-staged` for fast staged-file formatting and fixes
- `husky` to run lint checks in `.husky/pre-commit`

Key config details in this repo:

- `useTabs: true` in `.oxfmtrc.json`
- `experimentalSortImports` is enabled for stable import ordering
- `oxc/no-barrel-file` is an error, so use direct imports
- `typescript/no-explicit-any` is an error
- React, `jsx-a11y`, `unicorn`, `promise`, and `vitest` rules are enforced

The TypeScript compiler is also configured with strict, lint-like checks in
`tsconfig.base.json`, including:

- `strict: true`
- `noUnusedLocals`
- `noUnusedParameters`
- `noImplicitReturns`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noImplicitOverride`

<a id="commands-and-workflow"></a>

## Commands and Workflow

Formatting:

```bash
npm run format
npm run format:check
npm run format:list-different
```

Linting:

```bash
npm run lint
npm run lint:fix
npm run lint:list-files
npx tsc -b . --noEmit
npx tsc -p api/tsconfig.json --noEmit
```

Pre-commit behavior:

- `.husky/pre-commit` runs `npm run lint`
- `lint-staged` formats and applies safe fixes on staged files

Recommended workflow:

1. Run `npm run lint`
2. Run `npm run lint:fix` for safe autofixes
3. Make manual fixes where needed
4. Re-run `npm run lint`
5. Run `npm run format` if the edits touched formatting-sensitive code

<a id="core-practices"></a>

## Core Practices

- Avoid `any`; prefer `unknown` plus runtime checks or schema validation
- Import modules directly instead of through `index.ts` barrels
- Prefer `@/` alias imports over deep `../../` paths
- Keep formatting-only changes separate when that helps review
- Use rule disables sparingly, with a narrow scope and a clear reason
- Prefer explicit return types and well-named constants over terse code

When a rule must be relaxed, keep the exception local and documented:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- third-party API returns unknown JSON
const legacyData = oldLibrary.getData();
```

<a id="api-handler-patterns"></a>

## API Handler Patterns

### `no-unsafe-type-assertion` -- request validation

Never cast `request as Record<string, unknown>`. Use
`decodeUnknownSyncOrThrow` with a schema instead:

```typescript
// BAD
const body = request as Record<string, unknown>;
const tag_slug = body.tag_slug as string;

// GOOD
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { mySchema } from "@/shared/validation/mySchemas";

export default function extractMyRequest(request: unknown): MyRequest {
	return decodeUnknownSyncOrThrow(mySchema, request);
}
```

Schemas belong in `shared/src/validation/`, not `api/src/`.

### `no-unsafe-assignment` / `no-unsafe-call` / `no-unsafe-member-access` -- dynamic Supabase tables

Never cast the Supabase client to `any`. Use a typed branch per table:

```typescript
// BAD
const anyClient = client as any;
anyClient.from(dynamicTable).select("user_id");

// GOOD
if (itemType === "song") {
	const result =
		yield *
		$(
			Effect.tryPromise({
				try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
			}),
		);
	return result.data.user_id;
} else if (itemType === "playlist") {
	// ...
}
```

See `api/src/tags/getTagItemOwner.ts` for the canonical multi-type example.

### `all if-else branches contain same code` -- Supabase error check

Supabase returns errors in the response object, not as exceptions. Throw inside
`try` so one `catch` handles the shared error path:

```typescript
// BAD
const result = yield* $(Effect.tryPromise({
	try: () => client.from("...").insert([{ ... }]),
	catch: ...
}));
if (result.error) {
	return yield* $(Effect.fail(new DatabaseError({ ... })));
}

// GOOD
yield* $(Effect.tryPromise({
	try: async () => {
		const result = await client.from("my_table").insert([{ ... }]);
		if (result.error) {
			throw result.error;
		}
	},
	catch: (error: unknown) =>
		new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
}));
```

### `supabasefromlike optional method chain` -- use `callSelect`

`SupabaseClientLike.from().select()` may expose optional methods like `order`
and `eq`. Call the safe helper instead of chaining directly:

```typescript
// BAD
try: () => client.from("tag_library").select("user_id, tag_slug").order("tag_slug"),

// GOOD
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";

try: () => callSelect<TagLibraryEntry>(client, "tag_library", {
	cols: "user_id, tag_slug",
	order: "tag_slug",
}),
```

<a id="general-typescript-and-eslint-rules"></a>

## General TypeScript and ESLint Rules

### `id-length` -- variable names too short

```typescript
// BAD
const q = ctx.req.query("q");

// GOOD
const searchQuery = ctx.req.query("q") ?? "";
```

### `no-magic-numbers`

```typescript
// BAD
if (parsedLimit <= 0) { ... }

// GOOD
const MIN_LIMIT = 1;
if (parsedLimit < MIN_LIMIT) { ... }
```

### `no-negated-condition`

```typescript
// BAD
const safeLimit = parsedLimit !== undefined ? parsedLimit : DEFAULT_LIMIT;

// GOOD
const safeLimit = parsedLimit === undefined ? DEFAULT_LIMIT : parsedLimit;
```

### `prefer-number-properties`

Use `Number.*` static methods, not globals:

```typescript
// BAD
parseInt(limitParam, 10);
isNaN(parsedLimit);

// GOOD
Number.parseInt(limitParam, 10);
Number.isNaN(parsedLimit);
```

### `curly` -- always use braces

```typescript
// BAD
if (result.error) throw result.error;

// GOOD
if (result.error) {
	throw result.error;
}
```

### `consistent-type-imports` -- type-only imports

```typescript
// BAD
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";

// GOOD
import type getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
```

### `--isolatedDeclarations` -- explicit type annotations on exports

```typescript
// BAD
export const mySchema = Schema.Literal("a", "b", "c");

// GOOD
export const mySchema: Schema.Schema<"a" | "b" | "c", "a" | "b" | "c"> = Schema.Literal(
	"a",
	"b",
	"c",
);
```

### `no-unsafe-type-assertion` -- general code

For non-API code, prefer a runtime type guard when a schema would be too heavy:

```typescript
// BAD
const data = response as UserData;

// GOOD
function isUserData(value: unknown): value is UserData {
	return typeof value === "object" && value !== null && "id" in value;
}

if (!isUserData(response)) {
	throw new Error("Invalid data");
}

const data = response;
```

### `strict-boolean-expressions`

```typescript
// BAD
if (nullableString) {
}

// GOOD
if (nullableString !== null && nullableString !== undefined) {
}
```

### `exactOptionalPropertyTypes`

```typescript
// BAD
<Component optionalProp={maybeUndefined} />

// GOOD
<Component {...(maybeUndefined !== undefined && { optionalProp: maybeUndefined })} />
```

### `init-declarations`

```typescript
// BAD
let query: unknown;

// GOOD
let query: unknown = undefined;
```

### `no-confusing-void-expression`

```typescript
// BAD
onClick={() => setLoading(true)}

// GOOD
onClick={() => {
	setLoading(true);
}}
```

### `consistent-function-scoping`

```typescript
// BAD
function parent() {
	function helper() {
		return true;
	}
	return helper;
}

// GOOD
function helper() {
	return true;
}

function parent() {
	return helper;
}
```

<a id="unicorn-rules"></a>

## Unicorn Rules

### `unicorn/no-array-sort` -- use `toSorted()`

`Array#sort()` mutates the original array. Use `toSorted()` instead:

```typescript
// BAD
const sorted = items.sort();

// GOOD
const sorted = items.toSorted();
```

### `unicorn/catch-error-name` -- name catch parameter `error`

```typescript
// BAD
} catch (err: unknown) {
	console.error("Failed:", err);
}

// GOOD
} catch (error: unknown) {
	console.error("Failed:", error);
}
```

<a id="project-specific-rules"></a>

## Project-Specific Rules

### `require-useeffect-comment` -- comment before `useEffect`

Every `useEffect` call must be preceded by a comment that explains its
purpose:

```typescript
// BAD
useEffect(() => {
	void fetchData();
}, [fetchData]);

// GOOD
// Fetch data on mount and re-fetch when the location changes.
useEffect(() => {
	void fetchData();
}, [fetchData]);
```

### `oxc/no-barrel-file` -- no index re-exports

Import directly from source files:

```typescript
// BAD
import { Song } from "@/shared/generated";

// GOOD
import type { Song } from "@/shared/generated/database.types";
```

<a id="essential-type-guards"></a>

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

<a id="quick-reference-table"></a>

## Quick Reference Table

| Rule                                      | Wrong                                     | Right                                       |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| `id-length`                               | `const q = ...`                           | `const searchQuery = ...`                   |
| `no-unsafe-type-assertion` (API)          | `request as Record<...>`                  | `decodeUnknownSyncOrThrow(schema, request)` |
| `no-unsafe-assignment` / `no-unsafe-call` | `(client as any).from(...)`               | Typed `if/else` chain per table             |
| Duplicate Supabase branch endings         | `if (result.error) {...}` in every branch | Throw inside `try`; one `catch`             |
| `SupabaseFromLike` optional chain         | `.select().order(...)`                    | `callSelect(..., { order: ... })`           |
| `no-magic-numbers`                        | `limit <= 0`                              | `const MIN = 1; limit < MIN`                |
| `no-negated-condition`                    | `x !== undefined ? a : b`                 | `x === undefined ? b : a`                   |
| `prefer-number-properties`                | `parseInt(x, 10)`                         | `Number.parseInt(x, 10)`                    |
| `consistent-type-imports`                 | value import used only as a type          | `import type ...`                           |
| `curly`                                   | `if (x) throw err;`                       | `if (x) { throw err; }`                     |
| `isolatedDeclarations`                    | inferred exported schema type             | explicit schema annotation                  |
| `unicorn/no-array-sort`                   | `.sort()`                                 | `.toSorted()`                               |
| `unicorn/catch-error-name`                | `catch (err)`                             | `catch (error)`                             |
| `require-useeffect-comment`               | bare `useEffect(...)`                     | comment above `useEffect(...)`              |
| `oxc/no-barrel-file`                      | import from barrel                        | import from source file                     |

<a id="troubleshooting"></a>

## Troubleshooting

- If `oxlint` or `oxfmt` behaves differently on CI, confirm local package
  versions match the repo.
- If a pre-commit fails, run `npm run lint` for the full diagnostic output.
- If a rule feels too strict, propose a small targeted change with examples and
  migration notes instead of suppressing it broadly.

<a id="pr-checklist"></a>

## PR Checklist

- [ ] Run `npm run lint`
- [ ] Run `npm run format` when formatting-sensitive files changed
- [ ] Keep `any` out of new code
- [ ] Keep lint disables narrow and justified
- [ ] Prefer direct imports and explicit types

<a id="prompting-agents"></a>

## Prompting Agents

When you want an AI coding agent to produce code that passes lint on the first
try, point it at the repo rules and make validation part of the task.

Recommended prompt:

```text
Read AGENTS.md, .agent/rules.md, and the relevant docs before editing.

For this task, read:
- docs/lint-best-practices.md
- docs/typescript-best-practices.md
- any nearby feature-specific docs or skills for the files you touch

Requirements:
- Keep the change minimal and match nearby file patterns exactly
- Do not use any
- Do not create barrel files or import from barrel files
- Use direct imports from source files
- Keep React code React Compiler-friendly; do not add memoization unless the surrounding code already justifies it
- Do not add lint-disable comments in test files
- Prefer unknown + guards/schema validation over unsafe assertions
- Use import type when appropriate
- Add comments before every useEffect
- Reuse existing helpers and patterns instead of inventing new ones

Before finishing:
- Run npm run lint
- Fix any lint failures you introduced
- Summarize the root cause of any lint issues you had to fix
```

Short version:

```text
Read AGENTS.md, .agent/rules.md, and docs/lint-best-practices.md first.
Match surrounding patterns exactly.
No any, no barrel files, no test-file lint disables, and no unnecessary memoization.
Use explicit types, safe validation, direct imports, and useEffect comments.
Run npm run lint after editing and fix any issues before finishing.
```

Why this works:

- It points the agent at the repo-specific rules before it starts coding.
- It asks for small edits that match nearby patterns, which reduces drift.
- It names the rules agents most often violate in this repo.
- It requires real validation with `npm run lint`.

Repo-specific gotchas worth naming:

- This repo disallows barrel files and expects direct imports.
- `any` usually causes follow-on lint failures; use `unknown` and narrow it.
- Test files must not get lint-disable comments.
- React code should follow React Compiler-friendly patterns.
- Supabase code should prefer existing typed helpers over ad hoc method chains.
- Dynamic Tailwind values should use CSS custom properties, not runtime values in `tw\`\``.

Add one or two extra lines when the task touches a specialized area:

- Auth: also read `docs/auth/authentication-system.md`
- API handlers: also read the Hono and Effect docs
- Unit tests: also read `docs/testing/unit-test-best-practices.md`
- Hook tests: also read `docs/testing/unit-test-hook-best-practices.md`
- React components: also read `docs/client/react-best-practices.md`

<a id="see-also"></a>

## See Also

- [AGENTS.md](/AGENTS.md)
- [.agent/rules.md](/.agent/rules.md)
- [typescript-best-practices.md](/docs/typescript-best-practices.md)
- [testing/unit-test-best-practices.md](/docs/testing/unit-test-best-practices.md)
- [server/hono-best-practices.md](/docs/server/hono-best-practices.md)
- [doc-best-practices.md](/docs/doc-best-practices.md)
