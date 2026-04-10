# Hono Best Practices

Project-specific conventions for Hono API handlers in `api/`. For adding a new endpoint end-to-end, see [`.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md).

<a id="toc"></a>

## Table of Contents

- [File & Registration Pattern](#file-registration)
- [Handlers, Not Controllers](#handlers-not-controllers)
- [Route Grouping with `app.route()`](#route-grouping)
- [Advanced Route Patterns](#advanced-routes)
- [Handler Signature](#handler-signature)
- [Keep Handlers Thin](#thin-handlers)
- [Typed Context Variables](#typed-context)
- [Request Validation](#request-validation)
- [Authentication & Supabase Client](#authentication)
- [Supabase Error Handling](#supabase-errors)
- [Ownership Checks](#ownership-checks)
- [Dynamic Table Names](#dynamic-tables)
- [GET Query Parameters](#query-params)
- [Error Classes](#error-classes)
- [Global Error & Not-Found Handlers](#global-handlers)
- [Response Format](#response-format)
- [Testing with `app.request()`](#testing)
- [Linting & Type Checking](#linting)

---

<a id="file-registration"></a>

## File & Registration Pattern

Handlers live in `api/src/<feature>/<action>/<handlerName>.ts` and are registered in `api/src/server.ts` via `handleHttpEndpoint`:

```typescript
// api/src/server.ts
import { apiMyFeaturePath } from "@/shared/paths";
import myHandler from "./my-feature/action/myHandler";

app.post(apiMyFeaturePath, handleHttpEndpoint(myHandler));
app.get(apiMyFeaturePath, handleHttpEndpoint(myHandler));
```

Path constants live in `shared/src/paths.ts` — never hardcode route strings in `server.ts`.

---

<a id="handlers-not-controllers"></a>

## Handlers, Not Controllers

Avoid Rails-style controller classes. They break path-parameter type inference without complex generics. Keep route logic in handler functions co-located with their route or in dedicated handler files:

```typescript
// ✅ handler function — type inference works
app.get('/songs/:id', (c) => {
  const id = c.req.param('id') // inferred as string
  return c.json({ id })
})

// ❌ controller method — path params lose type inference
class SongController {
  get(c: Context) {
    const id = c.req.param('id') // type inference breaks here
    return c.json({ id })
  }
}
```

If you need controller-like grouping, use `factory.createHandlers()` from `hono/factory` — it preserves type inference. In practice, the project's per-file handler pattern (`myHandler.ts`) is preferred.

---

<a id="route-grouping"></a>

## Route Grouping with `app.route()`

For large feature areas, create a sub-app and mount it. This keeps `server.ts` from becoming a monolith and enables feature-level middleware:

```typescript
// api/src/songs/songsRouter.ts
import { Hono } from "hono";
import type { Bindings } from "@/api/bindings";

export const songsRouter = new Hono<{ Bindings: Bindings }>();

songsRouter.get("/", handleHttpEndpoint(listSongsHandler));
songsRouter.post("/save", handleHttpEndpoint(saveSongHandler));

// api/src/server.ts
import { songsRouter } from "./songs/songsRouter";
app.route("/api/songs", songsRouter);
```

---

<a id="advanced-routes"></a>

## Advanced Route Patterns

### Regex parameter constraints

Constrain path parameters to a specific pattern directly in the route string:

```typescript
// Only matches numeric IDs — no separate validation needed
app.get('/api/songs/:id{[0-9]+}', handleHttpEndpoint(getSongHandler));
```

### Optional parameters

```typescript
// Matches both /api/songs and /api/songs/json
app.get('/api/songs/:format?', handleHttpEndpoint(listSongsHandler));
```

### Wildcard paths

```typescript
// Catch-all for nested paths
app.get('/api/files/*', handleHttpEndpoint(fileHandler));
```

---

<a id="handler-signature"></a>

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

The return type must enumerate all error variants — don't use a generic `Error`.

---

<a id="thin-handlers"></a>

## Keep Handlers Thin

Handlers are HTTP glue only. Business logic belongs in service functions that are pure (no `ctx`, no Hono imports):

```typescript
// ✅ handler: extract input → call service → return response
export default function deleteSongHandler(ctx: ReadonlyContext) {
	return Effect.gen(function* ($) {
		const body = yield* $(parseBody(ctx));
		const req = extractDeleteSongRequest(body);
		yield* $(deleteSong(req.song_id, userId)); // service call
		return { success: true };
	});
}

// ✅ service: pure domain logic, no Hono types
export function deleteSong(
	songId: string,
	userId: string,
): Effect.Effect<void, DatabaseError | AuthorizationError> {
	return Effect.gen(function* ($) {
		// ownership check + DB delete
	});
}
```

---

<a id="typed-context"></a>

## Typed Context Variables

When middleware sets values that downstream handlers need, type the context variables to avoid unsafe casts:

```typescript
// Define the shape of variables stored on context
type AppVariables = {
  requestId: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

// Middleware sets the value
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// Handler retrieves it — fully typed, no cast needed
app.get('/api/debug', (c) => {
  const requestId = c.get('requestId');
  return c.json({ requestId });
});
```

`ReadonlyContext` wraps this — check `api/src/hono/ReadonlyContext.type.ts` for which variables are already defined.

---

<a id="request-validation"></a>

## Request Validation

Schemas live in `shared/src/validation/`, never in the API feature folder. Use `decodeUnknownSyncOrThrow` via a dedicated extract function:

```typescript
// shared/src/validation/mySchemas.ts
export const myActionSchema = Schema.Struct({
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

In the handler, wrap the extraction in a try/catch and fail with `ValidationError`:

```typescript
let req: MyActionRequest = { item_id: "", name: "" };
try {
	req = extractMyActionRequest(body);
} catch (error: unknown) {
	return yield* $(
		Effect.fail(new ValidationError({ message: extractErrorMessage(error, "Invalid request") })),
	);
}
```

**Never** do manual field-by-field validation — it triggers `no-unsafe-type-assertion` and `id-length` lint errors.

---

<a id="authentication"></a>

## Authentication & Supabase Client

```typescript
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";

const userSession = yield* $(getVerifiedUserSession(ctx));
const userId = userSession.user.user_id;

// Service-role client bypasses RLS — enforce ownership in code
const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);
```

---

<a id="supabase-errors"></a>

## Supabase Error Handling

Supabase returns errors in the response object rather than throwing. Throw inside `try` so the `catch` branch handles everything uniformly:

```typescript
// ✅ correct — single catch handles all error branches
yield* $(
	Effect.tryPromise({
		try: async () => {
			const result = await client.from("my_table").insert([{ ... }]);
			if (result.error) throw result.error;
		},
		catch: (error: unknown) =>
			new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
	}),
);

// ❌ wrong — triggers "all if blocks contain same code" lint error
const result = yield* $(Effect.tryPromise({ try: () => ..., catch: ... }));
if (result.error) return yield* $(Effect.fail(new DatabaseError(...)));
```

---

<a id="ownership-checks"></a>

## Ownership Checks

Always verify the requesting user owns the resource before mutating it. Fetch the `user_id` from the DB and compare:

```typescript
const itemResult = yield* $(
	Effect.tryPromise({
		try: () =>
			client.from("song_public").select("user_id").eq("song_id", req.song_id).single(),
		catch: (error) =>
			new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
	}),
);

if (itemResult.error || itemResult.data === null) {
	return yield* $(Effect.fail(new DatabaseError({ message: "Song not found" })));
}
if (itemResult.data.user_id !== userId) {
	return yield* $(Effect.fail(new ValidationError({ message: "You do not have permission" })));
}
```

---

<a id="dynamic-tables"></a>

## Dynamic Table Names

When an endpoint spans multiple item types, **never** cast `client as any` — use a typed `if/else` chain or a shared helper (see `api/src/tags/getTagItemOwner.ts`):

```typescript
// ❌ triggers no-unsafe-assignment, no-unsafe-call, no-unsafe-member-access
const anyClient = client as any;
anyClient.from(dynamicTable).select("user_id");

// ✅ typed if/else per item type
if (itemType === "song") {
	const result = yield* $(
		Effect.tryPromise({
			try: () => client.from("song_public").select("user_id").eq("song_id", itemId).single(),
			catch: (error) => new DatabaseError({ message: extractErrorMessage(error, "DB error") }),
		}),
	);
	return result.data.user_id;
} else if (itemType === "playlist") {
	// ...
}
```

---

<a id="query-params"></a>

## GET Query Parameters

Use descriptive variable names — the `id-length` lint rule requires a minimum of 2 characters:

```typescript
const searchQuery = ctx.req.query("q") ?? "";      // ✅
const limitParam = ctx.req.query("limit");
const parsedLimit = limitParam === undefined ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10);

// ❌ const q = ctx.req.query("q"); — single-char variable triggers id-length
```

---

<a id="error-classes"></a>

## Error Classes

Defined in `api/src/api-errors.ts`. Choose the correct class — HTTP status is derived from the error type:

| Error class           | HTTP status | When to use                           |
| --------------------- | ----------- | ------------------------------------- |
| `ValidationError`     | 400         | Bad input, failed ownership check     |
| `AuthenticationError` | 401         | Missing or invalid token              |
| `AuthorizationError`  | 403         | Valid token, insufficient permissions |
| `NotFoundError`       | 404         | Resource does not exist               |
| `DatabaseError`       | 500         | Supabase / DB errors                  |

---

<a id="global-handlers"></a>

## Global Error & Not-Found Handlers

`handleHttpEndpoint` maps Effect errors to HTTP responses automatically. For anything outside that wrapper (e.g., uncaught throws, 404s), register global handlers in `server.ts`:

```typescript
// Catch unhandled errors not covered by handleHttpEndpoint
app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.json({ success: false, error: "Internal server error" }, 500);
});

// Handle requests to routes that don't exist
app.notFound((c) => {
	return c.json({ success: false, error: `Route not found: ${c.req.path}` }, 404);
});
```

Register these after all route definitions so they don't shadow real routes.

---

<a id="response-format"></a>

## Response Format

All endpoints wrapped with `handleHttpEndpoint` return:

```json
{ "success": true, "data": { ... } }
```

Error responses:

```json
{ "success": false, "error": "Description of what went wrong" }
```

Clients must unwrap `data` before using the payload — see [api-reference.md](api-reference.md) for full response shapes.

---

<a id="testing"></a>

## Testing with `app.request()`

Prefer `app.request()` over constructing mock contexts — it exercises the full Hono stack including middleware:

```typescript
import { describe, it, expect } from "vitest";
import app from "@/api/server";

describe("GET /api/hello", () => {
	it("returns 200", async () => {
		const res = await app.request("/api/hello");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({ message: expect.any(String) });
	});
});

describe("POST /api/songs/save", () => {
	it("rejects unauthenticated requests", async () => {
		const res = await app.request("/api/songs/save", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title: "Test" }),
		});
		expect(res.status).toBe(401);
	});
});
```

For integration tests that need a real Supabase connection, see the unit test skill files.

---

<a id="linting"></a>

## Linting & Type Checking

Always run both before committing:

```bash
npx tsc -p api/tsconfig.json --noEmit   # type-check API only
npm run lint                             # full lint suite
```

Never use `npx eslint` directly — always `npm run lint`.
