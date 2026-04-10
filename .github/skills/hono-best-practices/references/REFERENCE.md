# Hono Best Practices — Reference

Deep-dive examples for the API layer. For the full narrative doc see [/docs/server/hono-best-practices.md](/docs/server/hono-best-practices.md).

---

## Route Grouping with `app.route()`

```typescript
// api/src/songs/songsRouter.ts
import { Hono } from "hono";
import type { Bindings } from "@/api/bindings";
import { handleHttpEndpoint } from "@/api/hono/handleHttpEndpoint";
import { apiSongsSavePath, apiSongsDeletePath } from "@/shared/paths";
import saveSongHandler from "./save/saveSongHandler";
import deleteSongHandler from "./delete/deleteSongHandler";

export const songsRouter = new Hono<{ Bindings: Bindings }>();

songsRouter.post(apiSongsSavePath, handleHttpEndpoint(saveSongHandler));
songsRouter.delete(apiSongsDeletePath, handleHttpEndpoint(deleteSongHandler));

// api/src/server.ts
import { songsRouter } from "./songs/songsRouter";
app.route("/api/songs", songsRouter);
```

---

## Typed Context Variables

Define variables on `AppVariables` so `c.set()`/`c.get()` are fully typed — no `as` casts downstream:

```typescript
// api/src/hono/AppVariables.type.ts
export type AppVariables = {
  requestId: string;
};

// api/src/server.ts
import { Hono } from "hono";
import type { Bindings } from "@/api/bindings";
import type { AppVariables } from "./hono/AppVariables.type";

const app = new Hono<{ Bindings: Bindings; Variables: AppVariables }>();

app.use("*", async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
});

app.get("/api/debug", (c) => {
  const requestId = c.get("requestId"); // string — fully typed
  return c.json({ requestId });
});
```

---

## Thin Handler + Service Layer

The handler is HTTP glue only. Business logic lives in a pure service function:

```typescript
// api/src/songs/delete/deleteSongService.ts — no Hono imports
import { Effect } from "effect";
import { DatabaseError, AuthorizationError } from "@/api/api-errors";
import type { SupabaseClient } from "@/api/supabase/getSupabaseServerClient";
import extractErrorMessage from "@/shared/utils/extractErrorMessage";

export function deleteSong(
  client: SupabaseClient,
  songId: string,
  userId: string,
): Effect.Effect<void, DatabaseError | AuthorizationError> {
  return Effect.gen(function* deleteSongGen($) {
    const fetchResult = yield* $(
      Effect.tryPromise({
        try: () =>
          client.from("song_public").select("user_id").eq("song_id", songId).single(),
        catch: (error) =>
          new DatabaseError({ message: extractErrorMessage(error, "Failed to fetch song") }),
      }),
    );
    if (fetchResult.error || fetchResult.data === null) {
      return yield* $(Effect.fail(new DatabaseError({ message: "Song not found" })));
    }
    if (fetchResult.data.user_id !== userId) {
      return yield* $(
        Effect.fail(new AuthorizationError({ message: "You do not have permission" })),
      );
    }
    yield* $(
      Effect.tryPromise({
        try: async () => {
          const result = await client.from("song_public").delete().eq("song_id", songId);
          if (result.error) throw result.error;
        },
        catch: (error) =>
          new DatabaseError({ message: extractErrorMessage(error, "Failed to delete song") }),
      }),
    );
  });
}

// api/src/songs/delete/deleteSongHandler.ts — thin glue layer
import { Effect } from "effect";
import { ValidationError, DatabaseError, AuthorizationError } from "@/api/api-errors";
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import getSupabaseServerClient from "@/api/supabase/getSupabaseServerClient";
import getVerifiedUserSession from "@/api/user-session/getVerifiedSession";
import extractDeleteSongRequest from "./extractDeleteSongRequest";
import { deleteSong } from "./deleteSongService";
import extractErrorMessage from "@/shared/utils/extractErrorMessage";

export default function deleteSongHandler(
  ctx: ReadonlyContext,
): Effect.Effect<{ success: boolean }, ValidationError | DatabaseError | AuthorizationError> {
  return Effect.gen(function* deleteSongHandlerGen($) {
    const userSession = yield* $(getVerifiedUserSession(ctx));
    const userId = userSession.user.user_id;
    const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

    const body: unknown = yield* $(Effect.tryPromise({
      try: () => ctx.req.json(),
      catch: (error) => new ValidationError({ message: extractErrorMessage(error, "Invalid JSON") }),
    }));

    let req = { song_id: "" };
    try {
      req = extractDeleteSongRequest(body);
    } catch (error: unknown) {
      return yield* $(
        Effect.fail(new ValidationError({ message: extractErrorMessage(error, "Invalid request") })),
      );
    }

    yield* $(deleteSong(client, req.song_id, userId));
    return { success: true };
  });
}
```

---

## Supabase Error Handling (canonical pattern)

```typescript
// ✅ correct — throw inside try so one catch branch handles everything
yield* $(
  Effect.tryPromise({
    try: async () => {
      const result = await client.from("my_table").insert([{ user_id: userId, name: req.name }]);
      if (result.error) throw result.error;
    },
    catch: (error: unknown) =>
      new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
  }),
);

// ❌ wrong — outer if triggers "all if-else branches contain same code" oxlint error
const result = yield* $(Effect.tryPromise({
  try: () => client.from("my_table").insert([{ user_id: userId, name: req.name }]),
  catch: (error) => new DatabaseError({ message: extractErrorMessage(error, "Failed to insert") }),
}));
if (result.error) {
  return yield* $(Effect.fail(new DatabaseError({ message: result.error.message })));
}
```

---

## Advanced Route Patterns

```typescript
// Regex constraint — only numeric IDs reach this handler
app.get("/api/songs/:id{[0-9]+}", handleHttpEndpoint(getSongHandler));

// Optional format parameter
// Matches /api/songs and /api/songs/json
app.get("/api/songs/:format?", handleHttpEndpoint(listSongsHandler));

// Wildcard — catch all nested paths under /api/files/
app.get("/api/files/*", handleHttpEndpoint(fileHandler));
```

---

## Global Error & Not-Found Handlers

Register after all route definitions:

```typescript
// api/src/server.ts

// ... all app.get/post/route() calls above ...

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ success: false, error: "Internal server error" }, 500);
});

app.notFound((c) => {
  return c.json({ success: false, error: `Route not found: ${c.req.path}` }, 404);
});
```

---

## Logging Middleware

```typescript
// api/src/middleware/loggingMiddleware.ts
import type { Context, Next } from "hono";

export async function loggingMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  console.log(`[${method}] ${path} — ${c.res.status} — ${duration}ms`);
}

// api/src/server.ts
app.use("*", loggingMiddleware);
```

---

## Request Caching Middleware

```typescript
// api/src/middleware/cacheMiddleware.ts
import type { Context, MiddlewareHandler, Next } from "hono";

export function cacheMiddleware(ttlMs: number): MiddlewareHandler {
  const cache = new Map<string, { data: unknown; expires: number }>();

  return async (c: Context, next: Next) => {
    const cacheKey = `${c.req.method}:${c.req.path}`;
    const cached = cache.get(cacheKey);

    if (cached !== undefined && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    await next();

    cache.set(cacheKey, { data: c.res, expires: Date.now() + ttlMs });
  };
}

// Cache expensive GET routes for 60 seconds
app.get("/api/stats", cacheMiddleware(60_000), handleHttpEndpoint(statsHandler));
```

---

## Paginated Response Pattern

```typescript
// api/src/songs/list/listSongsHandler.ts
import type { ReadonlyContext } from "@/api/hono/ReadonlyContext.type";
import { Effect } from "effect";
import { DatabaseError } from "@/api/api-errors";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export default function listSongsHandler(
  ctx: ReadonlyContext,
): Effect.Effect<{ data: unknown[]; pagination: unknown }, DatabaseError> {
  return Effect.gen(function* listSongsHandlerGen($) {
    const limitParam = ctx.req.query("limit");
    const offsetParam = ctx.req.query("offset");
    const parsedLimit = Math.min(
      limitParam === undefined ? DEFAULT_LIMIT : Number.parseInt(limitParam, 10),
      MAX_LIMIT,
    );
    const parsedOffset = offsetParam === undefined ? 0 : Number.parseInt(offsetParam, 10);

    const client = getSupabaseServerClient(ctx.env.VITE_SUPABASE_URL, ctx.env.SUPABASE_SERVICE_KEY);

    const listResult = yield* $(
      Effect.tryPromise({
        try: () =>
          client
            .from("song_public")
            .select("*", { count: "exact" })
            .range(parsedOffset, parsedOffset + parsedLimit - 1),
        catch: (error) =>
          new DatabaseError({ message: extractErrorMessage(error, "Failed to list songs") }),
      }),
    );

    if (listResult.error) {
      return yield* $(Effect.fail(new DatabaseError({ message: listResult.error.message })));
    }

    const totalCount = listResult.count ?? 0;
    return {
      data: listResult.data,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: totalCount,
        hasMore: parsedOffset + parsedLimit < totalCount,
      },
    };
  });
}
```

---

## Testing with `app.request()`

Prefer `app.request()` over mock contexts — it runs the full Hono middleware stack:

```typescript
// api/src/songs/delete/deleteSongHandler.test.ts
import { describe, it, expect, vi } from "vitest";
import app from "@/api/server";

describe("DELETE /api/songs/:id", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await app.request("/api/songs/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: "song-123" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 200 for valid authenticated request", async () => {
    // Provide a valid JWT in Authorization header
    const res = await app.request("/api/songs/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`,
        Origin: "http://localhost:5173",
      },
      body: JSON.stringify({ song_id: "song-123" }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true });
  });
});
```

For unit-testing the handler function in isolation (without HTTP), see [unit-test-best-practices/SKILL.md](/.github/skills/unit-test-best-practices/SKILL.md).
