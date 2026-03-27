---
name: hono-api-patterns
description: Hono API route handlers, middleware patterns, request/response handling, and integration with Effect-TS. Use when building API endpoints, implementing middleware, handling errors, or validating request data.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# Hono API Patterns Skill

## Use When

Use this skill when:

- Creating or editing Hono route handlers, middleware, or request/response logic in `api/`.
- Implementing endpoint validation and error handling for Effect-based HTTP flows.

Execution workflow:

1. Read the full workflow doc: [`.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md) before writing any code.
2. Keep endpoint logic in Effect and route through shared HTTP helpers.
3. Validate request input using `decodeUnknownSyncOrThrow` + shared schemas.
4. Reuse existing middleware and error mapping patterns before creating new abstractions.
5. Run `npm run lint` — do not skip it.

## File & Registration Pattern

Handlers live in `api/src/<feature>/<action>/<handlerName>.ts` and are registered in `api/src/server.ts`:

```typescript
// api/src/server.ts
import { apiMyFeaturePath } from "@/shared/paths";
import myHandler from "./my-feature/action/myHandler";

app.post(apiMyFeaturePath, handleHttpEndpoint(myHandler));
app.get(apiMyFeaturePath, handleHttpEndpoint(myHandler));
```

## Handler Signature

Always use `ReadonlyContext`, not `Context<{ Bindings: Bindings }>`:

```typescript
import { Effect } from "effect";
import { type AuthenticationError, DatabaseError, ValidationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";

export default function myHandler(
	ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthenticationError> {
	return Effect.gen(function* myHandlerGen($) {
		// ...
	});
}
```

## Request Validation — Extract Function Pattern

Schemas live in `shared/src/validation/`, not in the API feature folder. Use `decodeUnknownSyncOrThrow`:

```typescript
// shared/src/validation/mySchemas.ts
export const myActionSchema: Schema.Schema<OutputType, OutputType> = Schema.Struct({
	item_id: Schema.String,
	name: Schema.String.pipe(Schema.minLength(1)),
});

// api/src/my-feature/action/extractMyActionRequest.ts
import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";
import { myActionSchema } from "@/shared/validation/mySchemas";

export type MyActionRequest = { item_id: string; name: string };

export default function extractMyActionRequest(request: unknown): MyActionRequest {
	return decodeUnknownSyncOrThrow(myActionSchema, request);
}
```

In the handler:

```typescript
let req: MyActionRequest = { item_id: "", name: "" };
try {
	req = extractMyActionRequest(body);
} catch (error: unknown) {
	return (
		yield *
		$(Effect.fail(new ValidationError({ message: extractErrorMessage(error, "Invalid request") })))
	);
}
```

**Never** do manual field-by-field validation — it triggers `no-unsafe-type-assertion` and `id-length` lint errors.

## Authentication & Supabase Client

```typescript
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";

const userSession = yield * $(getVerifiedUserSession(ctx));
const userId = userSession.user.user_id;

// Service-role client bypasses RLS — enforce ownership in code
const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
```

## Supabase Error Handling

Supabase returns errors in the response object; throw inside `try` so `catch` handles everything:

```typescript
// ✅ correct — no repeated error checks per branch
yield* $(Effect.tryPromise({
  try: async () => {
    const result = await client.from("my_table").insert([{ ... }]);
    if (result.error) { throw result.error; }
  },
  catch: (error: unknown) =>
    new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
}));

// ❌ wrong — "all if blocks contain same code" lint error
const result = yield* $(Effect.tryPromise({ try: () => ..., catch: ... }));
if (result.error) { return yield* $(Effect.fail(new DatabaseError(...))); }
```

## Ownership Check

```typescript
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
	return yield * $(Effect.fail(new ValidationError({ message: "You do not have permission" })));
}
```

## Dynamic Table Names — Never Use `as any`

When an endpoint spans multiple item types, **never** use `client as any` — use a typed `if/else` chain or a shared helper (see `api/src/tags/getTagItemOwner.ts`):

```typescript
// ❌ triggers no-unsafe-assignment, no-unsafe-call, no-unsafe-member-access
const anyClient = client as any;
anyClient.from(dynamicTable).select("user_id");

// ✅ typed if/else per item type
if (itemType === "song") {
  const result = yield* $(Effect.tryPromise({
    try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
    catch: ...
  }));
  return result.data.user_id;
} else if (itemType === "playlist") { /* ... */ }
```

## GET Endpoint — Query Params

Use descriptive variable names (min 2 chars — `id-length` rule):

```typescript
const searchQuery = ctx.req.query("q") ?? ""; // ✅ not: const q = ...
const limitParam = ctx.req.query("limit");
const parsedLimit = limitParam === undefined ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10);
```

## Error Classes (`api/src/api-errors.ts`)

```
ValidationError   → 400   bad input, failed ownership check
AuthenticationError → 401  missing/invalid token
NotFoundError     → 404
DatabaseError     → 500   Supabase errors
AuthorizationError → 403
```

## Validation Commands

```bash
npx tsc -p api/tsconfig.json --noEmit  # type-check API only
npm run lint                            # full suite
```

## References

- Full endpoint workflow: [`.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md)
- Effect-TS patterns: [../effect-ts-patterns/SKILL.md](/.github/skills/effect-ts-patterns/SKILL.md)
- Unit testing API handlers: [../unit-test-best-practices/SKILL.md](/.github/skills/unit-test-best-practices/SKILL.md)
- Project rules: [`.agent/rules.md`](/.agent/rules.md)

## Do Not

- Do not use `Context<{ Bindings: Bindings }>` — use `ReadonlyContext`.
- Do not put schemas in `api/src/` — they belong in `shared/src/validation/`.
- Do not use `client as any` for dynamic table names.
- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
