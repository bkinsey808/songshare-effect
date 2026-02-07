---
name: hono-api-patterns
description: Hono API route handlers, middleware patterns, request/response handling, and integration with Effect-TS. Use when building API endpoints, implementing middleware, handling errors, or validating request data.
license: MIT
compatibility: Hono 4.x, Effect 3.x, TypeScript 5.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Hono API Patterns Skill

## What This Skill Does

Guides development of the SongShare API using Hono as the HTTP framework with Effect-TS for functional error handling:

- **Route handlers** - Clean, typed endpoints with request parsing
- **Middleware patterns** - Authentication, logging, error handling
- **Request/response handling** - Type-safe parsing and validation
- **Integration with Effect** - Converting Effect operations to HTTP responses
- **Error mapping** - Structured error types to HTTP status codes
- **Composable handlers** - Reusable middleware and utilities

## When to Use

- Building new API endpoints
- Creating or modifying middleware
- Implementing request validation and parsing
- Handling errors in HTTP context
- Adding authentication/authorization checks
- Integrating with Effect-TS services
- Responding with proper HTTP status codes

## Key Patterns

### 1. Basic Route Handler

```typescript
// api/src/server.ts
import { Hono } from "hono";
import { Context } from "hono";

const app = new Hono();

// Simple GET endpoint
app.get("/health", (c: Context) => {
  return c.json({ status: "ok" });
});

// Typed GET endpoint with path parameter
app.get("/songs/:id", (c: Context) => {
  const id = c.req.param("id");
  return c.json({ id, title: "Example Song" });
});

// POST with request body
app.post("/songs", async (c: Context) => {
  const body = await c.req.json();
  return c.json({ created: true, data: body }, 201);
});
```

**Why:** Hono provides clean syntax similar to Express but with better TypeScript support.

### 2. Integration with Effect-TS

Convert Effect operations to HTTP responses:

```typescript
// api/src/http-utils.ts
import { Effect } from "effect";
import { Context } from "hono";

/**
 * Execute an Effect operation within Hono context and convert to HTTP response.
 * Handles success and error cases, mapping typed errors to appropriate status codes.
 *
 * @param effect - The Effect operation to execute
 * @param c - Hono context to use for JSON response generation
 * @returns - Promise resolving to HTTP response
 */
export function executeEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  c: Context,
): Promise<Response> {
  return Effect.runPromise(effect).then(
    (value) => c.json({ success: true, data: value }),
    (error) => {
      // Map typed errors to HTTP responses
      if (error instanceof ValidationError) {
        return c.json({ error: error.message }, 400);
      }
      if (error instanceof NotFoundError) {
        return c.json({ error: `${error.resource} not found` }, 404);
      }
      return c.json({ error: "Internal server error" }, 500);
    },
  );
}

// Usage in handler
app.post("/songs", async (c: Context) => {
  const songEffect = Effect.gen(function* () {
    const body = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Invalid JSON" }),
    });
    // ... rest of effect
    return result;
  });

  return executeEffect(songEffect, c);
});
```

**Why:** Separates Effect logic from HTTP concerns; centralized error mapping.

### 3. Request Validation

Parse and validate requests with Effect Schema:

```typescript
// api/src/schemas.ts
import { Schema } from "effect";

export const CreateSongSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  artist: Schema.String.pipe(Schema.minLength(1)),
  duration: Schema.Number.pipe(Schema.positive()),
});

// api/src/server.ts
app.post("/songs", async (c: Context) => {
  const createEffect = Effect.gen(function* () {
    const body = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Invalid JSON" }),
    });

    const validated = yield* Schema.decodeUnknown(CreateSongSchema)(body).pipe(
      Effect.mapError(
        (error) => new ValidationError({ message: error.message }),
      ),
    );

    // validated is now typed and safe
    return { id: "123", ...validated };
  });

  return executeEffect(createEffect, c);
});
```

**Why:** Type-safe validation with detailed error messages; single source of truth.

### 4. Middleware Pattern

Create reusable middleware for cross-cutting concerns:

```typescript
// api/src/middleware/auth.ts
import { Context, Next } from "hono";

/**
 * Middleware to verify authorization token and attach user to context.
 * Returns 401 if token is missing or invalid.
 *
 * @param c - Hono context for this request
 * @param next - Function to continue to next middleware
 */
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const token = c.req.header("authorization");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify token and attach to context
  const user = await verifyToken(token);
  c.set("user", user);

  await next();
}

// api/src/server.ts
app.use("/api/*", authMiddleware);

app.get("/api/profile", (c: Context) => {
  const user = c.get("user");
  return c.json({ user });
});
```

**Why:** Middleware keeps authentication logic separate; reusable across routes.

### 5. Error Handling

Map typed errors to proper HTTP responses:

```typescript
// api/src/errors.ts
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

// api/src/server.ts
app.onError((error, c: Context) => {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json(
      { error: `${error.resource} ${error.id} not found` },
      404,
    );
  }
  return c.json({ error: "Internal server error" }, 500);
});
```

**Why:** Centralized error handling; consistent error responses.

### 6. Typed Context Variables

Store typed data on context for later use:

```typescript
// api/src/types.ts
export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
};

// api/src/middleware/auth.ts
export async function authMiddleware(c: Context<{ Variables: { user: User } }>, next: Next): Promise<void> {
  const token = c.req.header("authorization");
  const user = await verifyToken(token);
  c.set("user", user);
  await next();
}

// api/src/server.ts
app.get("/api/profile", (c: Context<{ Variables: { user: User } }>) => {
  const user = c.get("user"); // Type-safe!
  return c.json({ user });
});
```

**Why:** TypeScript ensures context variables are typed; prevents runtime errors.

## Common Patterns

### Query Parameters

```typescript
app.get("/songs", (c: Context) => {
  const limit = c.req.query("limit") || "10";
  const offset = c.req.query("offset") || "0";

  return c.json({
    limit: parseInt(limit),
    offset: parseInt(offset),
  });
});

// Usage: GET /songs?limit=20&offset=40
```

### Path Parameters

```typescript
app.get("/songs/:id", (c: Context) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// Usage: GET /songs/abc123
```

### Headers

```typescript
app.post("/upload", (c: Context) => {
  const contentType = c.req.header("content-type");
  const authorization = c.req.header("authorization");

  return c.json({ contentType, authorization });
});
```

### JSON Response with Status Code

```typescript
app.post("/songs", async (c: Context) => {
  const song = { id: "123", title: "New Song" };
  return c.json({ data: song }, 201); // 201 Created
});
```

### Empty Response

```typescript
app.delete("/songs/:id", (c: Context) => {
  return c.text("", 204); // 204 No Content
});
```

## Best Practices

### ✅ DO

- **Type everything** - Parameters, request body, response shape
- **Validate input** - Use Effect Schema for runtime validation
- **Centralize error handling** - Use middleware and error mappers
- **Compose middleware** - Reuse auth, logging, etc. across routes
- **Use Effect** - Leverage functional error handling patterns
- **Return proper status codes** - 200, 201, 400, 404, 500, etc.

### ❌ DON'T

- **Throw errors** - Use Effect.fail() instead
- **Assume request validity** - Always validate JSON and parameters
- **Mix concerns** - Keep HTTP logic separate from business logic
- **Catch and swallow errors** - Map them to proper HTTP responses
- **Store sensitive data in context** - Use headers or encrypted cookies

## Common Pitfalls

### ❌ Not handling async JSON parsing

```typescript
// Bad: req.json() can throw
const body = c.req.json();
```

**✅ Better:**

```typescript
const body = await Effect.tryPromise({
  try: () => c.req.json(),
  catch: () => new ValidationError({ message: "Invalid JSON" }),
});
```

### ❌ Missing error handler

```typescript
// Bad: unhandled errors crash the app
app.post("/songs", async (c) => {
  throw new Error("Something went wrong");
});
```

**✅ Better:** Use app.onError middleware or Effect error handling.

### ❌ Inconsistent response shapes

```typescript
// Bad: sometimes { data }, sometimes { result }
app.get("/a", (c) => c.json({ data: value }));
app.get("/b", (c) => c.json({ result: value }));
```

**✅ Better:** Define response schemas and reuse them.

## Deep Reference

For detailed technical reference on advanced middleware composition, streaming responses, WebSocket integration, performance optimization, and integration patterns with Effect-TS, see [the reference guide](references/REFERENCE.md).

## Validation Commands

Run these after modifying API code:

```bash
# Type check
npx tsc -b api/

# Lint
npm run lint

# Unit tests (if testing handlers)
npm run test:unit

# Local server test
npm run dev:api
curl http://localhost:8787/health
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed patterns and advanced usage
- Hono documentation: https://hono.dev/
- Effect-TS documentation: https://effect.website/
- Effect-TS Patterns skill: [../effect-ts-patterns/SKILL.md](../effect-ts-patterns/SKILL.md)
- Project rules: [.agent/rules.md](../../../.agent/rules.md)
