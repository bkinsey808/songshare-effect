---
name: effect-ts-patterns
description: Effect-TS API patterns for Hono server (error handling, schema validation, service composition, dependency injection). Use when building API handlers, services, or working with structured error types.
license: MIT
compatibility: Node.js 20+, Effect 3.x, Hono 4.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Effect-TS Patterns Skill

## What This Skill Does

Guides development of the Hono API server using Effect-TS functional programming patterns:

- **Structured error handling** with typed `Data.TaggedError` classes
- **Schema validation** using Effect Schema for runtime type safety
- **Service layer** with Effect's dependency injection (Context and Layer)
- **HTTP utilities** to convert Effect errors to proper responses
- **Composable operations** using Effect combinators (`gen`, `pipe`, `map`, `flatMap`)

## When to Use

- Building new API endpoints or handlers in `api/src/`
- Creating or modifying service layer code
- Adding new error types or validation schemas
- Refactoring imperative try-catch code to functional Effect pipelines
- Setting up dependency injection for services

## Key Patterns

### 1. Define Typed Errors

Use Effect's `Data.TaggedError` for discriminated error unions:

```typescript
// api/src/errors.ts
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError") {
  constructor(readonly message: string) {
    super();
  }
}

export class NotFoundError extends Data.TaggedError("NotFoundError") {
  constructor(readonly resource: string, readonly id: string) {
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
// api/src/schemas.ts
import { Schema } from "effect";

export const CreateSongRequestSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  artist: Schema.String.pipe(Schema.minLength(1)),
  duration: Schema.Number.pipe(Schema.positive()),
});

export type CreateSongRequest = Schema.Schema.Type<
  typeof CreateSongRequestSchema
>;

// Usage in handler:
const validatedData = yield* Schema.decodeUnknown(
  CreateSongRequestSchema,
)(body).pipe(
  Effect.mapError(
    (error) =>
      new ValidationError({ message: Schema.formatIssueSync(error) }),
  ),
);
```

**Why:** Single source of truth for validation logic; errors are detailed and actionable.

### 3. Build Service Layer with Dependency Injection

Create service interfaces and implementations using Context:

```typescript
// api/src/services.ts
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

Use utility function to execute Effects and map errors to HTTP status codes:

```typescript
// api/src/http-utils.ts
import { Effect } from "effect";
import { Context } from "hono";

/**
 * Execute an Effect operation and convert the result to an HTTP response.
 * Maps typed errors to appropriate HTTP status codes.
 *
 * @param effect - The Effect operation to execute
 * @returns - Promise resolving to HTTP Response with success data or error message
 */
export function executeEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Promise<Response> {
  return Effect.runPromise(effect).then(
    (value) => new Response(JSON.stringify({ success: true, data: value }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    (error) => {
      // Map typed errors to HTTP responses
      if (error instanceof ValidationError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (error instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: `${error.resource} with id ${error.id} not found`,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }
      // Default error
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    },
  );
}
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
    const validatedData = yield* Schema.decodeUnknown(
      CreateSongRequestSchema,
    )(body).pipe(
      Effect.mapError(
        (error) =>
          new ValidationError({ message: Schema.formatIssueSync(error) }),
      ),
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
const result = yield* service.doSomething();
```

**✅ Better:** Convert Promises to Effects:

```typescript
const data = yield* Effect.tryPromise({
  try: () => somePromise,
  catch: (error) => new ApiError({ message: String(error) }),
});
const result = yield* service.doSomething();
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
const data = yield* Effect.tryPromise(() => dbQuery());
```

**✅ Better:** Always handle catch:

```typescript
const data = yield* Effect.tryPromise({
  try: () => dbQuery(),
  catch: () => new DatabaseError({ message: "Query failed" }),
});
```

## Deep Reference

For detailed technical reference on Effect combinators, dependency injection, schema validation, and HTTP integration patterns, see [the reference guide](references/REFERENCE.md).

## Validation Commands

Run these after writing Effect code:

```bash
# Type check
npx tsc -b .

# Lint
npm run lint

# Unit tests (if testing service layer)
npm run test:unit

# Full build
npm run build:api
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed Effect patterns
- Complete implementation guide: [docs/effect-implementation.md](../../../docs/effect-implementation.md)
- Effect documentation: https://effect.website/
- Hono API integration: See `api/src/server.ts`
- Error types: See `api/src/errors.ts`
- Service examples: See `api/src/services.ts`
