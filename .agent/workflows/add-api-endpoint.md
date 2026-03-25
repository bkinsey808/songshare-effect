---
description: Add a new API endpoint
---

# Add a New API Endpoint

This workflow covers the complete, lint-safe pattern for adding API endpoints. Follow it exactly to avoid common pitfalls — the lint rules are strict and non-obvious.

---

## Directory & File Structure

Feature-based folders with action subfolders under `api/src/`:

```
api/src/
└── <feature>/
    └── <action>/
        ├── extract<Action><Feature>Request.ts   # validation only
        └── <action><Feature>.ts                 # main handler
```

Examples from the codebase:

- `api/src/image-library/add/addImageToLibrary.ts`
- `api/src/tags/remove-from-item/removeTagFromItem.ts`
- `api/src/community/communityLibrary.ts` (GET with no body)

---

## Step 1 — Add Path Constants

Add to `shared/src/paths.ts`:

```typescript
// Use full /api/ prefix for API paths
export const apiMyFeatureDoSomethingPath = "/api/my-feature/do-something";
```

---

## Step 2 — Add Shared Schema (if mutations)

For endpoints that accept a request body, define a schema in `shared/src/validation/`:

```typescript
// shared/src/validation/myFeatureSchemas.ts
import { Schema } from "effect";

export const myFeatureDoSomethingSchema: Schema.Schema<
	{ readonly item_id: string; readonly name: string },
	{ readonly item_id: string; readonly name: string }
> = Schema.Struct({
	item_id: Schema.String,
	name: Schema.String.pipe(Schema.minLength(1)),
});
```

**Important:** Always add explicit type annotations — `--isolatedDeclarations` is enabled:

```typescript
// ✅ correct
export const mySchema: Schema.Schema<OutputType, InputType> = Schema.Struct({ ... });

// ❌ wrong — will fail tsc
export const mySchema = Schema.Literal("a", "b", "c");
```

---

## Step 3 — Write the Extract Function

Use `decodeUnknownSyncOrThrow` with the shared schema. **Never do manual field-by-field validation** — it triggers `no-unsafe-type-assertion` and `id-length` lint errors.

```typescript
// api/src/my-feature/do-something/extractDoSomethingRequest.ts
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { myFeatureDoSomethingSchema } from "@/shared/validation/myFeatureSchemas";

export type DoSomethingRequest = {
	item_id: string;
	name: string;
};

/**
 * Extract and validate the do-something request using the shared schema.
 *
 * @param request - Raw parsed JSON body.
 * @returns Validated `DoSomethingRequest`.
 * @throws Schema `ParseError` when required fields are missing or invalid.
 */
export default function extractDoSomethingRequest(request: unknown): DoSomethingRequest {
	return decodeUnknownSyncOrThrow(myFeatureDoSomethingSchema, request);
}
```

---

## Step 4 — Write the Handler

### POST (mutation) handler template

```typescript
import { Effect } from "effect";

import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractErrorMessage from "@/shared/error-message/extractErrorMessage";

import extractDoSomethingRequest, { type DoSomethingRequest } from "./extractDoSomethingRequest";

/**
 * Server-side handler for doing something.
 *
 * @param ctx - The readonly request context provided by the server.
 * @returns `{ success: true }` on success, or fails with a typed error.
 */
export default function doSomething(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* doSomethingGen($) {
		// 1. Parse JSON body
		const body: unknown = yield* $(
			Effect.tryPromise({
				try: async () => {
					const parsed: unknown = await ctx.req.json();
					return parsed;
				},
				catch: () => new ValidationError({ message: "Invalid JSON body" }),
			}),
		);

		// 2. Validate request
		let req: DoSomethingRequest = { item_id: "", name: "" };
		try {
			req = extractDoSomethingRequest(body);
		} catch (error: unknown) {
			return yield* $(
				Effect.fail(
					new ValidationError({ message: extractErrorMessage(error, "Invalid request") }),
				),
			);
		}

		// 3. Authenticate
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// 4. Get service-role client (bypasses RLS — owner checks must be done in code)
		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		// 5. Database operation — throw Supabase errors inside `try` so `catch` handles them
		yield* $(
			Effect.tryPromise({
				try: async () => {
					const result = await client
						.from("my_table")
						.insert([{ user_id: userId, item_id: req.item_id, name: req.name }]);
					if (result.error) {
						throw result.error;
					}
				},
				catch: (error: unknown) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to do something") }),
			}),
		);

		return { success: true };
	});
}
```

### GET handler template (query params, no body)

```typescript
export default function listThings(
	ctx: ReadonlyContext,
): Effect.Effect<{ items: string[] }, DatabaseError | AuthenticationError> {
	return Effect.gen(function* listThingsGen($) {
		const userSession = yield* $(getVerifiedUserSession(ctx));
		const userId = userSession.user.user_id;

		// Query params — use descriptive names (id-length rule: min 2 chars)
		const searchQuery = ctx.req.query("q") ?? "";
		const limitParam = ctx.req.query("limit");

		const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

		const queryResult = yield* $(
			Effect.tryPromise({
				try: () =>
					client
						.from("my_table")
						.select("name")
						.eq("user_id", userId)
						.ilike("name", `%${searchQuery}%`),
				catch: (error) =>
					new DatabaseError({ message: extractErrorMessage(error, "Failed to list things") }),
			}),
		);

		if (queryResult.error) {
			return yield* $(
				Effect.fail(
					new DatabaseError({
						message: extractErrorMessage(queryResult.error, "Failed to list things"),
					}),
				),
			);
		}

		return { items: (queryResult.data ?? []).map((row) => row.name) };
	});
}
```

---

## Step 5 — Register in server.ts

```typescript
// 1. Add to the import block from "@/shared/paths"
import {
	// ...existing...
	apiMyFeatureDoSomethingPath,
} from "@/shared/paths";

// 2. Import the handler
import doSomething from "./my-feature/do-something/doSomething";

// 3. Register the route
app.post(apiMyFeatureDoSomethingPath, handleHttpEndpoint(doSomething));
// or for GET:
app.get(apiMyFeatureDoSomethingPath, handleHttpEndpoint(listThings));
```

---

## Ownership Checks

The service-role client **bypasses RLS**. Always verify ownership in code before mutating:

```typescript
// ✅ correct ownership check
const itemResult =
	yield *
	$(
		Effect.tryPromise({
			try: () => client.from("song_public").select("user_id").eq("song_id", req.song_id).single(),
			catch: (error) =>
				new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
		}),
	);

if (itemResult.error || itemResult.data === null) {
	return yield * $(Effect.fail(new DatabaseError({ message: "Song not found" })));
}

if (itemResult.data.user_id !== userId) {
	return (
		yield *
		$(
			Effect.fail(
				new ValidationError({ message: "You do not have permission to modify this item" }),
			),
		)
	);
}
```

### Dynamic table ownership (multiple item types)

When an endpoint operates on multiple item types, **never** use `client as any` or dynamic table name strings — the Supabase typed client rejects them and `any` triggers multiple lint errors. Use a typed `if/else` chain or a shared helper:

```typescript
// ✅ correct — shared helper (see api/src/tags/getTagItemOwner.ts for a real example)
import getTagItemOwner from "../getTagItemOwner";
const ownerId = yield * $(getTagItemOwner(client, req.item_type, req.item_id));

// ❌ wrong — triggers no-unsafe-assignment, no-unsafe-call, no-unsafe-member-access
const anyClient = client as any;
anyClient.from(dynamicTableName).select("user_id");
```

When writing the helper, use an `if/else` chain with fully-typed calls for each case:

```typescript
if (itemType === "song") {
  const result = yield* $(Effect.tryPromise({
    try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
    catch: ...
  }));
  return result.data.user_id;
} else if (itemType === "playlist") {
  // ...
}
```

---

## Supabase Error Handling Pattern

Supabase returns errors in the response object, not as thrown exceptions. Throw inside `try` to let `catch` handle everything uniformly — this avoids the "all if blocks contain the same code" lint error:

```typescript
// ✅ correct — throw inside try, no trailing error check needed
yield* $(
  Effect.tryPromise({
    try: async () => {
      const result = await client.from("my_table").insert([{ ... }]);
      if (result.error) { throw result.error; }
    },
    catch: (error: unknown) =>
      new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
  }),
);

// ❌ wrong — repeating the same error check in every branch triggers lint
const result = yield* $(Effect.tryPromise({ try: () => client.from("...").insert([...]), catch: ... }));
if (result.error) {
  return yield* $(Effect.fail(new DatabaseError({ ... })));
}
```

---

## Lint Rules Quick Reference

These rules trip up code generation. Know them upfront:

| Rule                                      | ❌ Wrong                                              | ✅ Right                                            |
| ----------------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `id-length`                               | `const r = ...`, `const q = ...`                      | `const requestObj = ...`, `const searchQuery = ...` |
| `no-unsafe-type-assertion`                | `request as Record<string, unknown>`                  | Use `decodeUnknownSyncOrThrow` + schema             |
| `no-unsafe-assignment` / `no-unsafe-call` | `const c = client as any; c.from(...)`                | Typed `if/else` chain per table                     |
| `no-magic-numbers`                        | `limit <= 0`, `parseInt(x, 10)`                       | `const MIN = 1; limit < MIN`                        |
| `no-negated-condition`                    | `x !== undefined ? a : b`                             | `x === undefined ? b : a`                           |
| `prefer-number-properties`                | `parseInt(x, 10)`                                     | `Number.parseInt(x, 10)`                            |
| `consistent-type-imports`                 | `import Foo from "..."` (type only)                   | `import type Foo from "..."`                        |
| `curly`                                   | `if (x) throw err;`                                   | `if (x) { throw err; }`                             |
| `no-null`                                 | `JSON.stringify(x, null, 2)`                          | Avoid `null` literals                               |
| Duplicate branch endings                  | Same `if (result.error) {...}` at end of every branch | Throw inside `try`; one `catch` handles all         |

---

## Error Classes

From `api/src/api-errors.ts`:

```typescript
ValidationError; // 400 — bad input, failed ownership check
AuthenticationError; // 401 — missing/invalid token
NotFoundError; // 404
DatabaseError; // 500 — Supabase errors
AuthorizationError; // 403
```

---

## Verify Before Committing

```bash
npm run lint        # tsc + oxlint + eslint
npm run format      # oxfmt
```
