# Effect-TS Patterns Reference

Complete technical reference for Effect-TS API patterns, combinators, and service composition.

## Effect Combinators

### `Effect.gen` - Do-Notation Style

Provides readable, imperative-like syntax for Effect composition:

```typescript
import { Effect } from "effect";

const myEffect = Effect.gen(function* () {
  // Yields work like await
  const result1 = yield* someEffect;
  const result2 = yield* anotherEffect;

  // Return the final value
  return result1 + result2;
});
```

**When to use:** Main composition method for complex workflows.

### `Effect.pipe` - Functional Composition

Chain operations in left-to-right order:

```typescript
import { Effect, pipe } from "effect";

const result = pipe(
  someEffect,
  Effect.map((value) => value * 2),
  Effect.flatMap((doubled) => anotherEffect(doubled)),
  Effect.mapError((error) => new CustomError(error))
);
```

**When to use:** Simple transformations or error mapping.

### `Effect.map` - Transform Success

Map over the success value without affecting the error channel:

```typescript
const result = yield* Effect.map(getData(), (data) => ({
  ...data,
  processed: true,
}));
```

### `Effect.flatMap` - Sequence Effects

Chain two Effects where the second depends on the first's result:

```typescript
const result = yield* Effect.flatMap(
  getUser(userId),
  (user) => getSongLibrary(user.id)
);
```

### `Effect.mapError` - Transform Errors

Map errors to different error types:

```typescript
const result = yield* someEffect.pipe(
  Effect.mapError((error) => new ValidationError(String(error)))
);
```

### `Effect.tryPromise` - Convert Promises

Convert Promise-based operations to Effects with error handling:

```typescript
const data = yield* Effect.tryPromise({
  try: () => fetch("/api/data").then((r) => r.json()),
  catch: (error) => new NetworkError({ message: String(error) }),
});
```

**Best practice:** Always provide a `catch` that returns a proper error type.

### `Effect.fail` - Explicit Failure

Fail with a typed error:

```typescript
if (!user) {
  yield* Effect.fail(new NotFoundError({ resource: "User", id }));
}
```

### `Effect.all` - Parallel Execution

Run multiple Effects in parallel:

```typescript
const [songs, playlists, followers] = yield* Effect.all(
  [getSongs(userId), getPlaylists(userId), getFollowers(userId)],
  { concurrency: "unbounded" }
);
```

### `Effect.try` - Sync Error Handling

Handle synchronous try-catch scenarios:

```typescript
const parsed = yield* Effect.try({
  try: () => JSON.parse(jsonString),
  catch: (error) => new ParsingError({ message: String(error) }),
});
```

## Dependency Injection with Context & Layer

### Define a Service Interface

```typescript
import { Context, Effect, Layer } from "effect";

export type DatabaseService = {
  query: (sql: string) => Effect.Effect<unknown[], DatabaseError>;
  insert: (table: string, data: Record<string, unknown>) => Effect.Effect<void, DatabaseError>;
};

export const DatabaseService = Context.GenericTag<DatabaseService>(
  "DatabaseService"
);
```

### Implement with Layer

```typescript
export const DatabaseServiceLive = Layer.succeed(DatabaseService, {
  query: (sql) =>
    Effect.gen(function* () {
      const client = yield* getPooledConnection();
      const result = yield* Effect.tryPromise({
        try: () => client.query(sql),
        catch: () => new DatabaseError({ message: "Query failed" }),
      });
      return result.rows;
    }),

  insert: (table, data) =>
    Effect.gen(function* () {
      const client = yield* getPooledConnection();
      yield* Effect.tryPromise({
        try: () => client.insert(table, data),
        catch: () => new DatabaseError({ message: "Insert failed" }),
      });
    }),
});
```

### Use in Effects

```typescript
const myEffect = Effect.gen(function* () {
  const db = yield* DatabaseService;
  const results = yield* db.query("SELECT * FROM songs");
  return results;
}).pipe(Effect.provide(DatabaseServiceLive));
```

## Error Handling Patterns

### Error Composition (Error Union)

Define all possible error types:

```typescript
export type ApiError =
  | ValidationError
  | NotFoundError
  | DatabaseError
  | AuthenticationError;

export const createSong = (data: unknown): Effect.Effect<Song, ApiError> => {
  // Implementation
};
```

### Error Recovery

Provide fallback Effects on failure:

```typescript
const result = yield* someEffect.pipe(
  Effect.catchTag("NotFoundError", () => Effect.succeed(defaultValue)),
  Effect.catchTag("DatabaseError", () => retry(someEffect, 3))
);
```

### Error Logging

Chain error handling with side effects:

```typescript
const result = yield* someEffect.pipe(
  Effect.tapError((error) =>
    Effect.log(`[Error] ${error._tag}: ${error.message}`)
  )
);
```

## Schema Validation

### Define and Decode

```typescript
import { Schema } from "effect";

const UserSchema = Schema.Struct({
  id: Schema.String.pipe(Schema.uuid()),
  email: Schema.String.pipe(Schema.email()),
  age: Schema.Number.pipe(Schema.positive()),
});

type User = Schema.Schema.Type<typeof UserSchema>;

// In Effect
const validated = yield* Schema.decodeUnknown(UserSchema)(unknownData).pipe(
  Effect.mapError(
    (error) => new ValidationError({ message: Schema.formatIssueSync(error) })
  )
);
```

### Custom Validators

```typescript
const NonEmptyString = Schema.String.pipe(
  Schema.minLength(1),
  Schema.description("Non-empty string")
);

const UserInput = Schema.Struct({
  name: NonEmptyString,
  email: Schema.String.pipe(Schema.email()),
});
```

## HTTP Integration with Hono

### Execute Effects in Handlers

```typescript
app.post("/api/songs", async (c) => {
  const createSongEffect = Effect.gen(function* () {
    const body = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Invalid JSON" }),
    });

    const validated = yield* Schema.decodeUnknown(CreateSongSchema)(body).pipe(
      Effect.mapError((error) => new ValidationError({ message: error.message }))
    );

    const service = yield* SongService;
    return yield* service.create(validated);
  }).pipe(Effect.provide(SongServiceLive));

  return executeEffect(createSongEffect, c);
});
```

### Error-to-HTTP Mapping

```typescript
export function executeEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  c: Context
): Response {
  return Effect.runPromise(effect).then(
    (value) =>
      new Response(JSON.stringify({ success: true, data: value }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    (error) => {
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
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  );
}
```

## Service Composition

### Layered Services

```typescript
// Service A
const ServiceA = Context.GenericTag<ServiceA>("ServiceA");
export const ServiceALive = Layer.succeed(ServiceA, { /* ... */ });

// Service B depends on A
const ServiceB = Context.GenericTag<ServiceB>("ServiceB");
export const ServiceBLive = Layer.succeed(ServiceB, {
  doSomething: () =>
    Effect.gen(function* () {
      const serviceA = yield* ServiceA;
      return yield* serviceA.operation();
    }),
});

// Combine layers
const AllServiceLive = Layer.merge(ServiceALive, ServiceBLive);

// Use in Effect
const result = Effect.gen(function* () {
  const serviceB = yield* ServiceB;
  return yield* serviceB.doSomething();
}).pipe(Effect.provide(AllServiceLive));
```

## References

- [Effect Documentation](https://effect.website/)
- [Effect API Reference](https://effect.website/docs/api/effect)
- [Effect Schema Documentation](https://effect.website/docs/schema/schema)
