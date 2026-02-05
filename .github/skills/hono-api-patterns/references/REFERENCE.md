# Hono API Patterns Reference Guide

## Advanced Route Handler Patterns

### Route Grouping

```typescript
// Organize routes by feature using Hono's app splitting

// api/src/routes/songs.ts
import { Hono } from "hono";

export const songsRouter = new Hono();

songsRouter.get("/", (c) => {
  return c.json({ songs: [] });
});

songsRouter.post("/", async (c) => {
  const body = await c.req.json();
  return c.json({ created: true }, 201);
});

songsRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// api/src/server.ts
const app = new Hono();
app.route("/api/songs", songsRouter);
```

**Benefits:**

- Logical organization by feature
- Easier to maintain and test
- Can be deployed independently

### Conditional Routing

```typescript
// Route based on environment or feature flags

const app = new Hono();

if (process.env.ENVIRONMENT === "development") {
  app.get("/debug", (c) => {
    return c.json({ debug: true });
  });
}

if (process.env.ENABLE_BETA_FEATURES === "true") {
  app.post("/api/beta", (c) => {
    return c.json({ beta: true });
  });
}
```

### Nested Parameters

```typescript
// Handle hierarchical resources

app.get("/users/:userId/songs/:songId", (c) => {
  const userId = c.req.param("userId");
  const songId = c.req.param("songId");

  return c.json({
    userId,
    songId,
    userOwnsThis: userId === songId, // simplified check
  });
});

// GET /users/user123/songs/song456
```

---

## Middleware Deep Dive

### Authentication Middleware

```typescript
// api/src/middleware/auth.ts
import { Context, Next } from "hono";
import { Data } from "effect";

export class UnauthorizedError extends Data.TaggedError(
  "UnauthorizedError",
) {
  constructor(readonly message: string) {
    super();
  }
}

/**
 * Extract and verify JWT from Authorization header.
 * Attaches decoded user to context for downstream handlers.
 *
 * @param c - Hono context for this request
 * @param next - Function to continue to next middleware
 * @throws UnauthorizedError if token is missing, malformed, or invalid
 */
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await verifyToken(token);
    c.set("user", decoded);
  } catch (error) {
    throw new UnauthorizedError("Invalid token");
  }

  await next();
}

// api/src/server.ts
app.use("/api/*", authMiddleware);

// Now all /api/* routes require auth
app.get("/api/profile", (c) => {
  const user = c.get("user");
  return c.json({ user });
});
```

### Logging Middleware

```typescript
// api/src/middleware/logging.ts
import { Context, Next } from "hono";

/**
 * Middleware to log request details and response time.
 * Outputs method, path, status code, and duration in milliseconds.
 *
 * @param c - Hono context for this request
 * @param next - Function to continue to next middleware
 */
export async function loggingMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`[${method}] ${path} - ${status} - ${duration}ms`);
}

// api/src/server.ts
app.use("*", loggingMiddleware);
```

### Rate Limiting Middleware

```typescript
// api/src/middleware/rateLimit.ts
import { Context, Next } from "hono";

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number; // milliseconds
};

/**
 * Create a rate limiting middleware that tracks requests per IP address.
 * Returns 429 Too Many Requests if limit exceeded within time window.
 *
 * @param config - Configuration with maxRequests and windowMs (milliseconds)
 * @returns - Middleware function that enforces rate limits
 */
export function rateLimitMiddleware(config: RateLimitConfig): MiddlewareHandler {
  const store = new Map<string, number[]>();

  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (!store.has(ip)) {
      store.set(ip, []);
    }

    const timestamps = store.get(ip)!.filter((t) => t > windowStart);

    if (timestamps.length >= config.maxRequests) {
      return c.json({ error: "Too many requests" }, 429);
    }

    timestamps.push(now);
    store.set(ip, timestamps);

    await next();
  };
}

// api/src/server.ts
app.use(
  "/api/*",
  rateLimitMiddleware({ maxRequests: 100, windowMs: 60000 }),
);
```

### Middleware Composition

```typescript
// Combine multiple middleware

async function protectedRoute(c: Context, next: Next): Promise<void> {
  // Apply multiple middleware in sequence
  await authMiddleware(c, next);
  await loggingMiddleware(c, next);
  await next();
}

app.get("/api/protected", protectedRoute, (c) => {
  return c.json({ protected: true });
});

// Or use app.use() for global middleware
app.use("*", loggingMiddleware);
app.use("/api/*", authMiddleware);
```

---

## Request Validation Patterns

### Form Data Validation

```typescript
// api/src/schemas.ts
import { Schema } from "effect";

export const UploadFileSchema = Schema.Struct({
  filename: Schema.String,
  size: Schema.Number.pipe(Schema.positive()),
  mimeType: Schema.String,
});

// api/src/server.ts
app.post("/upload", async (c) => {
  const formData = await c.req.formData();

  const validated = {
    filename: formData.get("filename"),
    size: parseInt(formData.get("size")),
    mimeType: formData.get("mimeType"),
  };

  const result = Schema.decodeSync(UploadFileSchema)(validated);
  return c.json({ uploaded: result });
});
```

### Query Parameter Validation

```typescript
// api/src/schemas.ts
export const ListQuerySchema = Schema.Struct({
  limit: Schema.Number.pipe(Schema.positive(), Schema.lessThanOrEqualTo(100)),
  offset: Schema.Number.pipe(Schema.nonNegative()),
  search: Schema.optional(Schema.String),
});

// api/src/server.ts
app.get("/songs", (c) => {
  const query = {
    limit: parseInt(c.req.query("limit") || "10"),
    offset: parseInt(c.req.query("offset") || "0"),
    search: c.req.query("search"),
  };

  const validated = Schema.decodeSync(ListQuerySchema)(query);
  return c.json({ query: validated });
});
```

### Multi-Field Validation

```typescript
// Custom validation for dependent fields

export const PriceRangeSchema = Schema.Struct({
  minPrice: Schema.Number.pipe(Schema.nonNegative()),
  maxPrice: Schema.Number.pipe(Schema.nonNegative()),
}).pipe(
  Schema.refine((data) => {
    if (data.minPrice > data.maxPrice) {
      return {
        success: false as const,
        error: new Schema.ValidationError({
          message: "minPrice must be less than maxPrice",
        }),
      };
    }
    return { success: true as const, value: data };
  }),
);
```

---

## Error Handling Patterns

### Global Error Handler

```typescript
// api/src/server.ts
import { ValidationError, NotFoundError, AuthenticationError } from "./errors";

app.onError((error, c: Context) => {
  console.error("Error:", error);

  if (error instanceof ValidationError) {
    return c.json(
      { error: "Validation failed", details: error.message },
      400,
    );
  }

  if (error instanceof NotFoundError) {
    return c.json(
      { error: `${error.resource} not found`, id: error.id },
      404,
    );
  }

  if (error instanceof AuthenticationError) {
    return c.json({ error: error.message }, 401);
  }

  // Default error
  return c.json({ error: "Internal server error" }, 500);
});
```

### Per-Route Error Handling

```typescript
// Handle errors specific to a route

app.post("/songs", async (c) => {
  try {
    const body = await c.req.json();
    const validated = Schema.decodeSync(CreateSongSchema)(body);
    return c.json({ created: true, data: validated }, 201);
  } catch (error) {
    if (error instanceof Schema.ValidationError) {
      return c.json(
        {
          error: "Invalid song data",
          details: Schema.formatIssueSync(error.issue),
        },
        400,
      );
    }
    throw error; // Let global handler catch it
  }
});
```

### Effect Integration Error Handling

```typescript
// Wrap Effect operations with proper error mapping

/**
 * Execute an Effect and convert result to HTTP response with error mapping.
 * Maps Effect errors to appropriate HTTP status codes and JSON responses.
 *
 * @param effect - The Effect operation to execute
 * @param c - Hono context for generating responses
 * @returns - Promise resolving to HTTP response with status code and body
 */
function executeEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  c: Context,
): Promise<Response> {
  return Effect.runPromise(effect).then(
    (value) => c.json({ success: true, data: value }),
    (error) => {
      // Map known errors to HTTP responses
      const errorMap: Record<string, [number, string]> = {
        ValidationError: [400, "Invalid input"],
        NotFoundError: [404, "Resource not found"],
        DatabaseError: [500, "Database error"],
        AuthenticationError: [401, "Unauthorized"],
      };

      const [status, message] =
        errorMap[error.constructor.name] || [500, "Internal server error"];

      return c.json({ error: message, details: error.message }, status);
    },
  );
}
```

---

## Response Patterns

### Consistent Response Format

```typescript
// Define standard response shapes

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
};

// Success response
app.get("/songs/:id", (c) => {
  const song = { id: "123", title: "Song" };
  return c.json({
    success: true,
    data: song,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

// Error response
app.get("/invalid", (c) => {
  return c.json(
    {
      success: false,
      error: "Not found",
      timestamp: new Date().toISOString(),
    } as ApiResponse,
    404,
  );
});
```

### Paginated Response

```typescript
type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

app.get("/songs", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10");
  const offset = parseInt(c.req.query("offset") || "0");

  const songs = await fetchSongs(limit, offset);
  const total = await countSongs();

  return c.json({
    data: songs,
    pagination: { limit, offset, total },
  } as PaginatedResponse);
});
```

### Streaming Response

```typescript
// For large responses or Server-Sent Events

app.get("/logs/stream", (c) => {
  return c.streamText(async (stream) => {
    for (let i = 0; i < 100; i++) {
      await stream.write(`log line ${i}\n`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });
});
```

---

## Integration with Effect-TS

### Service Integration

```typescript
// api/src/services.ts - Define services with Effect

import { Context, Effect, Layer } from "effect";

export type SongService = {
  getById: (id: string) => Effect.Effect<Song, NotFoundError>;
  create: (data: CreateSongRequest) => Effect.Effect<Song, ValidationError>;
  list: () => Effect.Effect<Song[], DatabaseError>;
};

export const SongService = Context.GenericTag<SongService>("SongService");

// Implementation
export const SongServiceLive = Layer.succeed(SongService, {
  getById: (id) =>
    Effect.gen(function* () {
      const song = yield* fetchSongFromDB(id);
      if (!song) {
        yield* Effect.fail(new NotFoundError("Song", id));
      }
      return song;
    }),
  // ... other methods
});

// api/src/server.ts - Use service in handler

app.get("/songs/:id", async (c) => {
  const id = c.req.param("id");

  const effect = Effect.gen(function* () {
    const service = yield* SongService;
    return yield* service.getById(id);
  }).pipe(Effect.provide(SongServiceLive));

  return executeEffect(effect, c);
});
```

### Dependency Injection in Handlers

```typescript
// Pass services through context

type HandlerDependencies = {
  songService: SongService;
  logger: Logger;
};

/**
 * Higher-order function to inject dependencies into route handlers.
 * Attaches dependencies to context for access in handler.
 *
 * @param dependencies - Object containing services and utilities to inject
 * @returns - Middleware function that attaches deps to context
 */
export function withDependencies<T extends Record<string, any>>(
  dependencies: T,
) {
  return (handler: (c: Context & { deps: T }) => Promise<Response>) => {
    return async (c: Context) => {
      return handler({ ...c, deps: dependencies });
    };
  };
}

// Usage
const deps = {
  songService: new SongServiceImpl(),
  logger: new ConsoleLogger(),
};

app.get(
  "/songs/:id",
  withDependencies(deps),
  async (c: Context & { deps: HandlerDependencies }) => {
    const song = await c.deps.songService.getById(c.req.param("id"));
    c.deps.logger.info("Retrieved song", song.id);
    return c.json(song);
  },
);
```

---

## Performance Patterns

### Request Caching

```typescript
/**
 * Create middleware that caches successful responses for specified duration.
 * Caches by method and path; skips on cache miss.
 *
 * @param ttlMs - Time-to-live in milliseconds for cached responses
 * @returns - Middleware function implementing response caching
 */
function cacheMiddleware(ttlMs: number): MiddlewareHandler {
  const cache = new Map<string, { data: any; expires: number }>();

  return async (c: Context, next: Next) => {
    const key = `${c.req.method}:${c.req.path}`;
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    await next();

    cache.set(key, {
      data: c.res,
      expires: Date.now() + ttlMs,
    });
  };
}

app.get("/stats", cacheMiddleware(60000), async (c) => {
  const stats = await computeExpensiveStats();
  return c.json(stats);
});
```

### Request Batching

```typescript
// Allow clients to batch multiple requests

app.post("/batch", async (c) => {
  const requests = await c.req.json();

  const results = await Promise.all(
    requests.map((req: any) => {
      switch (req.method) {
        case "GET":
          return fetchSong(req.path);
        case "POST":
          return createSong(req.data);
        default:
          return { error: "Unknown method" };
      }
    }),
  );

  return c.json({ results });
});

// Client can send multiple requests at once:
// POST /batch
// [
//   { method: "GET", path: "/songs/1" },
//   { method: "GET", path: "/songs/2" },
//   { method: "POST", data: { title: "New Song" } }
// ]
```

### Lazy Loading & Pagination

```typescript
// Avoid loading all data at once

app.get("/songs", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  const songs = await db.songs.select().limit(limit).offset(offset);
  const total = await db.songs.count();

  return c.json({
    data: songs,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
  });
});
```

---

## Testing Patterns

### Handler Testing with Mock Context

```typescript
// api/src/server.test.ts
import { describe, it, expect } from "vitest";

describe("Song handlers", () => {
  it("creates a song", async () => {
    const mockContext = {
      req: {
        method: "POST",
        json: async () => ({ title: "Test", artist: "Artist" }),
      },
      json: (data: any, status?: number) => ({
        status,
        data,
      }),
    };

    const result = await createSongHandler(mockContext);
    expect(result.status).toBe(201);
    expect(result.data.created).toBe(true);
  });
});
```

### Middleware Testing

```typescript
describe("Auth middleware", () => {
  it("rejects requests without token", async () => {
    const context = {
      req: { header: () => undefined },
      json: (data: any, status: number) => ({ status, data }),
    };

    const result = await authMiddleware(context, async () => {});
    expect(result.status).toBe(401);
  });

  it("allows valid tokens", async () => {
    let nextCalled = false;
    const context = {
      req: { header: () => "Bearer valid-token" },
      set: () => {},
    };

    await authMiddleware(context, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });
});
```
