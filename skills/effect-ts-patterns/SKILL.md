---
name: effect-ts-patterns
description: Effect-TS API patterns for Hono server (error handling, schema validation, service composition, dependency injection). Use when building API handlers, services, or working with structured error types.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# Effect-TS Patterns Skill

## Use When

Use this skill when:

- Editing files under `api/` that use Effect, Hono handlers, schema decoding, or typed API errors.
- Implementing/refactoring handlers, services, or error mapping in the Effect stack.

Note: Prefer exposing functions that return an `Effect` instead of raw `Promise` results. Convert
Promise-based boundaries to Effects with `Effect.tryPromise` so downstream code composes and maps
errors using Effect combinators.

Execution workflow:

1. Identify the feature boundary (handler, service, schema, error type).
2. Keep errors typed (`Data.TaggedError`), decode/validate untrusted input, and keep async work in `Effect`.
3. Use existing HTTP integration helpers (`handleHttpEndpoint`, `errorToHttpResponse`) instead of duplicating response mapping.
4. Validate with `npm run lint` and targeted unit tests for changed service/handler behavior.

Output requirements:

- Summarize which Effect patterns were applied (typed errors, schema decode, service DI, HTTP mapping).
- Note any intentional deviations from these patterns.

## Key Patterns

### 1. Define Typed Errors

Use Effect's `Data.TaggedError` for discriminated error unions:

```typescript
// api/src/api-errors.ts
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError") {
	constructor(readonly message: string) {
		super();
	}
}

export class NotFoundError extends Data.TaggedError("NotFoundError") {
	constructor(
		readonly resource: string,
		readonly id: string,
	) {
		super();
	}
}

export class DatabaseError extends Data.TaggedError("DatabaseError") {
	constructor(readonly message: string) {
		super();
	}
}

type ApiError = ValidationError | NotFoundError | DatabaseError;
```

**Why:** Structured errors enable type-safe error handling, better error messages, and compile-time guarantees about what can fail.

### 2. Create Validation Schemas

Use Effect Schema for runtime validation with compile-time type inference:

```typescript
// Per-feature schema file, e.g. api/src/song/songSchemas.ts
import { Schema } from "effect";

export const CreateSongRequestSchema = Schema.Struct({
	title: Schema.String.pipe(Schema.minLength(1)),
	artist: Schema.String.pipe(Schema.minLength(1)),
	duration: Schema.Number.pipe(Schema.positive()),
});

export type CreateSongRequest = Schema.Schema.Type<typeof CreateSongRequestSchema>;

// Usage in handler:
const validatedData =
	yield *
	Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
		Effect.mapError((error) => new ValidationError({ message: Schema.formatIssueSync(error) })),
	);
```

**Why:** Single source of truth for validation logic; errors are detailed and actionable.

### 3. Build Service Layer with Dependency Injection

Create service interfaces and implementations using Context:

```typescript
// Per-feature service file, e.g. api/src/song/songService.ts
import { Context, Effect, Layer } from "effect";

// Define service interface
export type SongService = {
  readonly create: (data: CreateSongRequest) => Effect.Effect<Song, ValidationError | DatabaseError>;
  readonly getById: (id: string) => Effect.Effect<Song, NotFoundError | DatabaseError>;
  readonly list: () => Effect.Effect<Song[], DatabaseError>;
};

export const SongService = Context.GenericTag<SongService>(
  "SongService",
);

// Implement service
export const SongServiceLive = Layer.succeed(SongService, {
  create: (data) =>
    Effect.gen(function* () {
      // Implementation here
      return songData;
    }),
  getById: (id) =>
    Effect.gen(function* () {
      const song = yield* Effect.tryPromise({
        try: () => db.query("SELECT * FROM songs WHERE id = $1", [id]),
        catch: () => new DatabaseError({ message: "Query failed" }),
      });
      if (!song) {
        yield* Effect.fail(new NotFoundError({ resource: "Song", id }));
      }
      return song;
    }),
  list: () => /* ... */,
});
```

**Why:** Services become testable units; dependency injection enables swapping implementations (real DB vs mock for tests).

### 4. Convert Effects to HTTP Responses

The project provides two utilities under `api/src/http/`:

- **`handleHttpEndpoint`** — wraps an Effect-returning function and runs it as a Hono response handler
- **`errorToHttpResponse`** — maps typed `ApiError` variants to HTTP `Response` objects with appropriate status codes

```typescript
// api/src/song/songHandler.ts
import { handleHttpEndpoint } from "@/api/http/handleHttpEndpoint";

app.post("/api/songs", async (c) => {
	return handleHttpEndpoint(() =>
		Effect.gen(function* () {
			const body = yield* Effect.tryPromise({
				try: () => c.req.json(),
				catch: () => new ValidationError({ message: "Invalid JSON" }),
			});
			const service = yield* SongService;
			return yield* service.create(body);
		}),
	)(c);
});
```

**Why:** Centralized error-to-HTTP conversion eliminates repetitive error handling in every endpoint.

### 5. Compose Effects in Handlers

Use `Effect.gen` for readable, sequential Effect composition:

```typescript
// api/src/server.ts
app.post("/api/songs", async (c) => {
	const songEffect = Effect.gen(function* () {
		// Parse JSON (can fail with ValidationError)
		const body = yield* Effect.tryPromise({
			try: () => c.req.json(),
			catch: () => new ValidationError({ message: "Invalid JSON" }),
		});

		// Validate against schema
		const validatedData = yield* Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
			Effect.mapError((error) => new ValidationError({ message: Schema.formatIssueSync(error) })),
		);

		// Call service (injected via Context)
		const service = yield* SongService;
		const song = yield* service.create(validatedData);

		return song;
	});

	return executeEffect(songEffect);
});
```

**Why:** Effect.gen provides do-notation style that reads like imperative code but retains functional guarantees.

## Common Pitfalls

### ❌ Mixing Promise and Effect

```typescript
// Bad: mixing Promise and Effect
const data = await somePromise;
const result = yield * service.doSomething();
```

**✅ Better:** Convert Promises to Effects:

```typescript
const data =
	yield *
	Effect.tryPromise({
		try: () => somePromise,
		catch: (error) => new ApiError({ message: String(error) }),
	});
const result = yield * service.doSomething();
```

### ❌ Throwing errors instead of using Effect.fail

```typescript
// Bad
if (!data) {
  throw new NotFoundError(...);
}
```

**✅ Better:**

```typescript
if (!data) {
  yield* Effect.fail(new NotFoundError(...));
}
```

### ❌ Ignoring error channels

```typescript
// Bad: not mapping promise rejection to proper error type
const data = yield * Effect.tryPromise(() => dbQuery());
```

**✅ Better:** Always handle catch:

```typescript
const data =
	yield *
	Effect.tryPromise({
		try: () => dbQuery(),
		catch: () => new DatabaseError({ message: "Query failed" }),
	});
```

## Deep Reference

For detailed technical reference on Effect combinators, dependency injection, schema validation, and HTTP integration patterns, see [the reference guide](/skills/effect-ts-patterns/references/REFERENCE.md).

## Validation Commands

Run these after writing Effect code:

```bash
# Lint
npm run lint

# Unit tests (if testing service layer)
npm run test:unit

# Full build
npm run build:api
```

## References

- Reference guide: [references/REFERENCE.md](/skills/effect-ts-patterns/references/REFERENCE.md) - Detailed Effect patterns
- Complete implementation guide: [docs/effect-ts-best-practices.md](/docs/effect-ts-best-practices.md)
- Effect documentation: https://effect.website/
- Hono API integration: See `api/src/server.ts`
- Error types: See `api/src/api-errors.ts`

## Do Not

- Do not violate repo-wide rules in `docs/ai/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If editing Hono routes/middleware, also load `hono-best-practices`.
- If auth token behavior is involved, also load `authentication-system`.
