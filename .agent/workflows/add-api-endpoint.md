---
description: Add a new API endpoint
---

# Add a New API Endpoint

This workflow guides you through adding a new API endpoint to the Hono server.

## Steps

### 1. Define the Endpoint

Decide on:

- **HTTP method**: GET, POST, PUT, DELETE
- **Path**: e.g., `/api/songs/:id`, `/api/auth/signin`
- **Purpose**: What does this endpoint do?
- **Authentication**: Does it require user/visitor token?

### 2. Create Handler Function

Create a new file in the appropriate feature directory:

```bash
# For song-related endpoints:
api/src/song/[handlerName].ts

# For auth endpoints:
api/src/auth/[handlerName].ts

# For user endpoints:
api/src/user/[handlerName].ts
```

### 3. Implement Handler with Effect-TS

Use Effect-TS for structured error handling:

```typescript
// Example: api/src/song/getSong.ts
import { Effect } from "effect";
import { type Context } from "hono";
import { type Bindings } from "@/api/env";
import { NotFoundError, DatabaseError } from "@/api/errors";
import { getSupabaseClient } from "@/api/supabase/getSupabaseClient";

export function getSong(ctx: Context<{ Bindings: Bindings }>) {
	const songId = ctx.req.param("id");

	return Effect.gen(function* () {
		// 1. Validate input
		if (!songId) {
			return yield* Effect.fail(
				new NotFoundError({ message: "Song ID is required" }),
			);
		}

		// 2. Get Supabase client
		const supabase = yield* getSupabaseClient(ctx);

		// 3. Query database
		const { data, error } = await supabase
			.from("songs")
			.select("*")
			.eq("id", songId)
			.single();

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({ message: "Failed to fetch song", cause: error }),
			);
		}

		if (!data) {
			return yield* Effect.fail(
				new NotFoundError({ message: "Song not found" }),
			);
		}

		// 4. Return success response
		return yield* Effect.succeed({
			success: true,
			data,
		});
	});
}
```

### 4. Add Route to Server

Open `api/src/server.ts` and add your route:

```typescript
// Import the handler
import { getSong } from "./song/getSong";
import { handleHttpEndpoint } from "./http/http-utils";

// Add the route (find the appropriate section in the file)
app.get(
	"/api/songs/:id",
	handleHttpEndpoint((ctx) => getSong(ctx)),
);
```

### 5. Add Types to Shared (if needed)

If the endpoint uses new types, add them to shared:

```typescript
// shared/src/types/api.ts
export interface GetSongResponse {
	success: boolean;
	data: Song;
}

export interface GetSongRequest {
	id: string;
}
```

### 6. Test the Endpoint Locally

// turbo
Start the dev server:

```bash
npm run dev
```

Test with curl:

```bash
# GET example
curl http://localhost:8787/api/songs/123

# POST example
curl -X POST http://localhost:8787/api/songs \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Song","artist":"Test Artist"}'
```

Or use a tool like Postman, Insomnia, or Thunder Client.

### 7. Add Error Handling

Use proper Effect-TS error types from `api/src/errors.ts`:

```typescript
import {
	NotFoundError,
	ValidationError,
	DatabaseError,
	UnauthorizedError,
	ForbiddenError,
} from "@/api/errors";

// Example usage
if (!userId) {
	return (
		yield * Effect.fail(new ValidationError({ message: "User ID is required" }))
	);
}

if (!hasPermission) {
	return (
		yield *
		Effect.fail(new ForbiddenError({ message: "Insufficient permissions" }))
	);
}
```

### 8. Add CSRF Protection (for mutations)

For POST, PUT, DELETE endpoints that modify data:

```typescript
import { verifySameOriginOrThrow } from "@/api/csrf/verifySameOriginOrThrow";

app.post("/api/songs", (ctx) => {
	// Verify same-origin to prevent CSRF
	verifySameOriginOrThrow(ctx);

	return handleHttpEndpoint((ctx) => createSong(ctx))(ctx);
});
```

### 9. Document the Endpoint

Add to `docs/api-reference.md`:

````markdown
### GET /api/songs/:id

Get a song by ID.

**Authentication**: Visitor or User token

**Parameters**:

- `id` (path): Song ID

**Response**:

```json
{
	"success": true,
	"data": {
		"id": "123",
		"title": "Song Title",
		"artist": "Artist Name"
	}
}
```
````

**Errors**:

- `404`: Song not found
- `500`: Database error

````

### 10. Lint and Format

// turbo
```bash
npm run lint:fix
npm run format
````

### 11. Build and Test

// turbo

```bash
npm run build:api
```

## Common Patterns

### GET Endpoint (List)

```typescript
export function listSongs(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		const supabase = yield* getSupabaseClient(ctx);

		const { data, error } = await supabase
			.from("songs")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({ message: "Failed to fetch songs", cause: error }),
			);
		}

		return yield* Effect.succeed({
			success: true,
			data: data ?? [],
		});
	});
}
```

### POST Endpoint (Create)

```typescript
import { Effect, Schema } from "effect";

// Define schema for validation
const CreateSongSchema = Schema.Struct({
	title: Schema.String,
	artist: Schema.optional(Schema.String),
});

export function createSong(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		// 1. Parse and validate request body
		const body = await ctx.req.json();
		const validatedData = yield* Schema.decodeUnknown(CreateSongSchema)(body);

		// 2. Get Supabase client
		const supabase = yield* getSupabaseClient(ctx);

		// 3. Insert into database
		const { data, error } = await supabase
			.from("songs")
			.insert([validatedData])
			.select()
			.single();

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({ message: "Failed to create song", cause: error }),
			);
		}

		return yield* Effect.succeed({
			success: true,
			data,
		});
	});
}
```

### PUT Endpoint (Update)

```typescript
export function updateSong(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		const songId = ctx.req.param("id");
		const updates = await ctx.req.json();

		const supabase = yield* getSupabaseClient(ctx);

		const { data, error } = await supabase
			.from("songs")
			.update(updates)
			.eq("id", songId)
			.select()
			.single();

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({ message: "Failed to update song", cause: error }),
			);
		}

		return yield* Effect.succeed({
			success: true,
			data,
		});
	});
}
```

### DELETE Endpoint

```typescript
export function deleteSong(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		const songId = ctx.req.param("id");

		const supabase = yield* getSupabaseClient(ctx);

		const { error } = await supabase.from("songs").delete().eq("id", songId);

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({ message: "Failed to delete song", cause: error }),
			);
		}

		return yield* Effect.succeed({
			success: true,
			message: "Song deleted",
		});
	});
}
```

### With Authentication

```typescript
import getSupabaseUserToken from "@/api/supabase/getSupabaseUserToken";

export function protectedEndpoint(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		// Get user token from request
		const authHeader = ctx.req.header("Authorization");
		if (!authHeader) {
			return yield* Effect.fail(
				new UnauthorizedError({ message: "Authorization required" }),
			);
		}

		// Verify token and get user
		const token = authHeader.replace("Bearer ", "");
		const user = yield* verifyUserToken(token);

		// Continue with authenticated logic
		// ...
	});
}
```

## Complete Example

Here's a complete example with all parts:

**File: `api/src/song/getSongById.ts`**

```typescript
import { Effect } from "effect";
import { type Context } from "hono";
import { type Bindings } from "@/api/env";
import { NotFoundError, DatabaseError, ValidationError } from "@/api/errors";
import { getSupabaseClient } from "@/api/supabase/getSupabaseClient";

export function getSongById(ctx: Context<{ Bindings: Bindings }>) {
	return Effect.gen(function* () {
		const songId = ctx.req.param("id");

		if (!songId?.trim()) {
			return yield* Effect.fail(
				new ValidationError({ message: "Song ID is required" }),
			);
		}

		const supabase = yield* getSupabaseClient(ctx);

		const { data, error } = await supabase
			.from("songs")
			.select("*")
			.eq("id", songId)
			.single();

		if (error) {
			return yield* Effect.fail(
				new DatabaseError({
					message: "Failed to fetch song",
					cause: error,
				}),
			);
		}

		if (!data) {
			return yield* Effect.fail(
				new NotFoundError({ message: `Song with ID ${songId} not found` }),
			);
		}

		return yield* Effect.succeed({
			success: true,
			data,
		});
	});
}
```

**Add to `api/src/server.ts`:**

```typescript
import { getSongById } from "./song/getSongById";

app.get(
	"/api/songs/:id",
	handleHttpEndpoint((ctx) => getSongById(ctx)),
);
```

## References

- [Effect-TS Documentation](https://effect.website/)
- [Hono Documentation](https://hono.dev/)
- [API Reference](file:///home/bkinsey/bkinsey808/songshare-effect/docs/api-reference.md)
- [Project Rules](file:///home/bkinsey/bkinsey808/songshare-effect/.agent/rules.md)
