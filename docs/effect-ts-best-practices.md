# Effect-TS Best Practices

> **Note:** For TypeScript-specific patterns (strict types, `as const satisfies`, schema type
> extraction), see [TypeScript Best Practices](typescript-best-practices.md).

This document covers Effect-TS patterns used in this project: typed errors,
schema validation, service composition, dependency injection, and Hono HTTP integration.

Note: Prefer functions that return an `Effect` instead of raw `Promise` values for almost any
function. Only return a Promise from a function if there is a very good reason to.
Make sure any function that returns a Promise has thorough code comments that explain why.
Expose Effects from modules and convert Promise boundaries to Effects using
`Effect.tryPromise` so callers can compose, test, and map errors in the Effect model.

## Table of Contents

- [Quick Decision Trees](#quick-decision-trees)
    - [Which Effect Combinator to Use](#which-effect-combinator-to-use)
    - [Where to Put a New Error Type](#where-to-put-a-new-error-type)
- [Typed Errors](#typed-errors)
    - [Defining Tagged Errors](#defining-tagged-errors)
    - [Error Union Types](#error-union-types)
- [Schema Validation](#schema-validation)
    - [Defining Schemas](#defining-schemas)
    - [Decoding in Handlers](#decoding-in-handlers)
    - [Custom Validators](#custom-validators)
- [Effect Combinators](#effect-combinators)
    - [Effect.gen for Sequential Composition](#effectgen-for-sequential-composition)
    - [Effect.pipe for Transformations](#effectpipe-for-transformations)
    - [Effect.tryPromise for Async Boundaries](#effecttrypromise-for-async-boundaries)
    - [Effect.try for Sync Error Handling](#effecttry-for-sync-error-handling)
    - [Effect.fail for Explicit Failures](#effectfail-for-explicit-failures)
    - [Effect.all for Parallel Execution](#effectall-for-parallel-execution)
    - [Effect.catchTag for Error Recovery](#effectcatchtag-for-error-recovery)
- [Service Layer and Dependency Injection](#service-layer-and-dependency-injection)
    - [Defining a Service Interface](#defining-a-service-interface)
    - [Implementing with Layer](#implementing-with-layer)
    - [Composing Multiple Services](#composing-multiple-services)
- [HTTP Integration](#http-integration)
    - [handleHttpEndpoint](#handlehttpendpoint)
    - [errorToHttpResponse](#errortohttpresponse)
    - [Full Handler Example](#full-handler-example)
- [Common Pitfalls](#common-pitfalls)
    - [Mixing Promises and Effects](#mixing-promises-and-effects)
    - [Throwing Instead of Effect.fail](#throwing-instead-of-effectfail)
    - [Bare Effect.tryPromise Without catch](#bare-effecttrypromise-without-catch)
    - [Ignoring Error Channels](#ignoring-error-channels)
- [Refactoring Promise-Returning Functions to Effect](#refactoring-promise-to-effect)
- [Quick Checklist](#quick-checklist)
- [See Also](#see-also)

---

<a id="quick-decision-trees"></a>

## Quick Decision Trees

<a id="which-effect-combinator-to-use"></a>

### Which Effect Combinator to Use

```
What kind of operation am I modeling?
├─ Sequential steps that depend on each other → Effect.gen
├─ Simple value transform (no error change) → Effect.map
├─ Chain to another Effect → Effect.flatMap or yield* inside gen
├─ Error type transform → Effect.mapError
├─ Async Promise → Effect.tryPromise (always provide catch)
├─ Sync throw risk → Effect.try (always provide catch)
├─ Explicit fail from condition → Effect.fail
├─ Parallel, independent Effects → Effect.all
└─ Recover from a specific error tag → Effect.catchTag
```

<a id="where-to-put-a-new-error-type"></a>

### Where to Put a New Error Type

```
Is the error specific to one feature (e.g. songs)?
├─ Yes → api/src/[feature]/[feature]-errors.ts
└─ No → Is it a generic API error (auth, DB, validation)?
    ├─ Yes → api/src/api-errors.ts
    └─ No → Create a shared errors file for the domain
```

---

<a id="typed-errors"></a>

## Typed Errors

<a id="defining-tagged-errors"></a>

### Defining Tagged Errors

Use `Data.TaggedError` for all API errors. The tag string is used by `Effect.catchTag` and
enables discriminated union pattern matching at compile time.

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

export class AuthenticationError extends Data.TaggedError("AuthenticationError") {
  constructor(readonly message: string) {
    super();
  }
}
```

**Why:** Structured errors give you compile-time guarantees about what can fail and enable
`Effect.catchTag` for targeted recovery. They also produce actionable error messages instead
of generic `"Something went wrong"` strings.

<a id="error-union-types"></a>

### Error Union Types

Export a union of all error types that a service or handler can produce:

```typescript
// api/src/api-errors.ts
export type ApiError =
  | ValidationError
  | NotFoundError
  | DatabaseError
  | AuthenticationError;
```

Handlers that call multiple services compose their error unions automatically — TypeScript infers
the union from `yield*` calls inside `Effect.gen`.

---

<a id="schema-validation"></a>

## Schema Validation

<a id="defining-schemas"></a>

### Defining Schemas

Define schemas alongside the feature they validate. Always extract the TypeScript type from the
schema — never write the type manually.

```typescript
// api/src/song/song-schemas.ts
import { Schema } from "effect";

export const CreateSongRequestSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  artist: Schema.String.pipe(Schema.minLength(1)),
  duration: Schema.Number.pipe(Schema.positive()),
});

// ✅ Derive type from schema — single source of truth
export type CreateSongRequest = Schema.Schema.Type<typeof CreateSongRequestSchema>;

// ❌ Never write the type manually alongside the schema
// export type CreateSongRequest = { title: string; artist: string; duration: number };
```

<a id="decoding-in-handlers"></a>

### Decoding in Handlers

Use `Schema.decodeUnknown` inside `Effect.gen`. Map the schema parse error to a typed
`ValidationError` with `Schema.formatIssueSync` for human-readable messages.

```typescript
const validated = yield* Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
  Effect.mapError(
    (error) => new ValidationError({ message: Schema.formatIssueSync(error) }),
  ),
);
```

<a id="custom-validators"></a>

### Custom Validators

Compose constraints with `.pipe()`:

```typescript
const NonEmptyString = Schema.String.pipe(
  Schema.minLength(1),
  Schema.description("Non-empty string"),
);

const EmailInput = Schema.Struct({
  name: NonEmptyString,
  email: Schema.String.pipe(Schema.email()),
});
```

---

<a id="effect-combinators"></a>

## Effect Combinators

<a id="effectgen-for-sequential-composition"></a>

### Effect.gen for Sequential Composition

`Effect.gen` is the primary composition method. Use it for any workflow with two or more steps.
The `yield*` syntax behaves like `await` — it unwraps the success value or short-circuits on
error.

```typescript
const createSongEffect = Effect.gen(function* () {
  // Each yield* can fail independently
  const body = yield* Effect.tryPromise({
    try: () => c.req.json(),
    catch: () => new ValidationError({ message: "Invalid JSON" }),
  });

  const validated = yield* Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
    Effect.mapError((e) => new ValidationError({ message: Schema.formatIssueSync(e) })),
  );

  const service = yield* SongService;
  return yield* service.create(validated);
});
```

<a id="effectpipe-for-transformations"></a>

### Effect.pipe for Transformations

Use `.pipe()` for simple, single-step transformations — error mapping, value mapping, or adding
middleware behavior — without the overhead of a full `gen` block.

```typescript
// Map error type
const result = yield* someEffect.pipe(
  Effect.mapError((e) => new ValidationError(String(e))),
);

// Map value
const doubled = yield* getData().pipe(
  Effect.map((value) => value * 2),
);

// Chain effects
const user = yield* getUserId().pipe(
  Effect.flatMap((id) => getUser(id)),
);
```

<a id="effecttrypromise-for-async-boundaries"></a>

### Effect.tryPromise for Async Boundaries

Wrap every Promise-based operation with `Effect.tryPromise`. Always provide a `catch` function
that returns a typed error — never leave the catch empty or use `() => new Error(...)`.

```typescript
// ✅ Correct: typed error in catch
const data = yield* Effect.tryPromise({
  try: () => fetch("/api/data").then((r) => r.json()),
  catch: (error) => new NetworkError({ message: String(error) }),
});

// ❌ Wrong: untyped catch
const data = yield* Effect.tryPromise(() => fetch("/api/data"));
```

<a id="effecttry-for-sync-error-handling"></a>

### Effect.try for Sync Error Handling

Use `Effect.try` when a synchronous operation may throw (e.g. `JSON.parse`):

```typescript
const parsed = yield* Effect.try({
  try: () => JSON.parse(jsonString),
  catch: (error) => new ValidationError({ message: String(error) }),
});
```

<a id="effectfail-for-explicit-failures"></a>

### Effect.fail for Explicit Failures

Use `yield* Effect.fail(...)` to short-circuit an `Effect.gen` block with a typed error. Do not
`throw` inside `Effect.gen`.

```typescript
// ✅ Correct: Effect.fail
if (!song) {
  yield* Effect.fail(new NotFoundError({ resource: "Song", id }));
}

// ❌ Wrong: throwing inside Effect.gen
if (!song) {
  throw new NotFoundError({ resource: "Song", id });
}
```

<a id="effectall-for-parallel-execution"></a>

### Effect.all for Parallel Execution

Run multiple independent Effects in parallel:

```typescript
const [songs, playlists, followers] = yield* Effect.all(
  [getSongs(userId), getPlaylists(userId), getFollowers(userId)],
  { concurrency: "unbounded" },
);
```

Default concurrency is sequential. Pass `{ concurrency: "unbounded" }` or a number to parallelize.

<a id="effectcatchtag-for-error-recovery"></a>

### Effect.catchTag for Error Recovery

Recover from a specific error variant without catching unrelated errors:

```typescript
const result = yield* someEffect.pipe(
  Effect.catchTag("NotFoundError", () => Effect.succeed(defaultValue)),
  Effect.catchTag("DatabaseError", () => retryEffect),
);
```

---

<a id="service-layer-and-dependency-injection"></a>

## Service Layer and Dependency Injection

<a id="defining-a-service-interface"></a>

### Defining a Service Interface

Define service type and tag together. The `Context.GenericTag` creates the DI token. The
identifier string must be unique across the app.

```typescript
// api/src/song/song-service.ts
import { Context, Effect } from "effect";
import type { CreateSongRequest } from "./song-schemas";
import type { DatabaseError, NotFoundError, ValidationError } from "../api-errors";
import type { Song } from "./song-types";

export type SongService = {
  readonly create: (
    data: CreateSongRequest,
  ) => Effect.Effect<Song, ValidationError | DatabaseError>;
  readonly getById: (
    id: string,
  ) => Effect.Effect<Song, NotFoundError | DatabaseError>;
  readonly list: () => Effect.Effect<Song[], DatabaseError>;
};

export const SongService = Context.GenericTag<SongService>("SongService");
```

<a id="implementing-with-layer"></a>

### Implementing with Layer

Provide the implementation via `Layer.succeed`. Each method returns an `Effect` — no raw Promises
or throws.

```typescript
// api/src/song/song-service.ts
import { Layer, Effect } from "effect";

export const SongServiceLive = Layer.succeed(SongService, {
  create: (data) =>
    Effect.gen(function* () {
      const id = crypto.randomUUID();
      yield* Effect.tryPromise({
        try: () => db.insert("songs", { id, ...data }),
        catch: () => new DatabaseError({ message: "Insert failed" }),
      });
      return { id, ...data };
    }),

  getById: (id) =>
    Effect.gen(function* () {
      const song = yield* Effect.tryPromise({
        try: () => db.findOne("songs", id),
        catch: () => new DatabaseError({ message: "Query failed" }),
      });
      if (!song) {
        yield* Effect.fail(new NotFoundError({ resource: "Song", id }));
      }
      return song;
    }),

  list: () =>
    Effect.tryPromise({
      try: () => db.findAll("songs"),
      catch: () => new DatabaseError({ message: "List failed" }),
    }),
});
```

<a id="composing-multiple-services"></a>

### Composing Multiple Services

Merge layers to provide multiple services to a handler:

```typescript
import { Layer } from "effect";

const AppLayer = Layer.merge(SongServiceLive, UserServiceLive);

const myEffect = Effect.gen(function* () {
  const songService = yield* SongService;
  const userService = yield* UserService;
  // ...
}).pipe(Effect.provide(AppLayer));
```

---

<a id="http-integration"></a>

## HTTP Integration

<a id="handlehttpendpoint"></a>

### handleHttpEndpoint

`handleHttpEndpoint` (in `api/src/http/handleHttpEndpoint.ts`) wraps an Effect-returning
function and runs it as a Hono response handler. Use it for every endpoint instead of manually
calling `Effect.runPromise`.

```typescript
import { handleHttpEndpoint } from "@/api/http/handleHttpEndpoint";

app.post("/api/songs", async (c) => {
  return handleHttpEndpoint(() =>
    Effect.gen(function* () {
      // ...build and return the song Effect
    }).pipe(Effect.provide(SongServiceLive)),
  )(c);
});
```

<a id="errortohttpresponse"></a>

### errorToHttpResponse

`errorToHttpResponse` (in `api/src/http/errorToHttpResponse.ts`) maps typed `ApiError` variants
to `Response` objects with the correct HTTP status codes:

| Error Type            | Status Code |
| --------------------- | ----------- |
| `ValidationError`     | 400         |
| `AuthenticationError` | 401         |
| `AuthorizationError`  | 403         |
| `NotFoundError`       | 404         |
| `DatabaseError`       | 500         |

Do not add ad-hoc status code mapping in handlers — extend this file if a new error type needs
a mapping.

<a id="full-handler-example"></a>

### Full Handler Example

Before Effect-TS (error-prone, untyped):

```typescript
// ❌ Before: try-catch with untyped errors
app.post("/api/songs", async (c) => {
  try {
    const body = await c.req.json();
    if (!validateSong(body)) {
      return c.json({ error: "Invalid data" }, 400);
    }
    const song = await createSong(body);
    return c.json({ data: song });
  } catch {
    return c.json({ error: "Something went wrong" }, 500);
  }
});
```

After Effect-TS (typed, composable):

```typescript
// ✅ After: typed errors, schema validation, DI
app.post("/api/songs", async (c) => {
  return handleHttpEndpoint(() =>
    Effect.gen(function* () {
      const body = yield* Effect.tryPromise({
        try: () => c.req.json(),
        catch: () => new ValidationError({ message: "Invalid JSON" }),
      });

      const validated = yield* Schema.decodeUnknown(CreateSongRequestSchema)(body).pipe(
        Effect.mapError(
          (e) => new ValidationError({ message: Schema.formatIssueSync(e) }),
        ),
      );

      const service = yield* SongService;
      return yield* service.create(validated);
    }).pipe(Effect.provide(SongServiceLive)),
  )(c);
});
```

---

<a id="common-pitfalls"></a>

## Common Pitfalls

<a id="mixing-promises-and-effects"></a>

### Mixing Promises and Effects

Do not mix `await` and `yield*` inside the same `Effect.gen` block.

```typescript
// ❌ Wrong: mixing await and yield*
const myEffect = Effect.gen(function* () {
  const data = await somePromise;           // breaks the Effect fiber
  const result = yield* service.doWork();
});

// ✅ Correct: wrap the Promise in Effect.tryPromise
const myEffect = Effect.gen(function* () {
  const data = yield* Effect.tryPromise({
    try: () => somePromise,
    catch: (e) => new ApiError({ message: String(e) }),
  });
  const result = yield* service.doWork();
});
```

<a id="throwing-instead-of-effectfail"></a>

### Throwing Instead of Effect.fail

Thrown exceptions inside `Effect.gen` bypass the error channel and produce untyped `Die` defects.

```typescript
// ❌ Wrong: throw inside Effect.gen
if (!record) {
  throw new NotFoundError({ resource: "Record", id });
}

// ✅ Correct: Effect.fail keeps the error typed
if (!record) {
  yield* Effect.fail(new NotFoundError({ resource: "Record", id }));
}
```

<a id="bare-effecttrypromise-without-catch"></a>

### Bare Effect.tryPromise Without catch

The two-argument form `Effect.tryPromise({ try, catch })` is required. Omitting `catch` widens
the error channel to `unknown`.

```typescript
// ❌ Wrong: one-argument form, error is unknown
const result = yield* Effect.tryPromise(() => db.query(sql));

// ✅ Correct: always provide catch with a typed error
const result = yield* Effect.tryPromise({
  try: () => db.query(sql),
  catch: () => new DatabaseError({ message: "Query failed" }),
});
```

<a id="ignoring-error-channels"></a>

### Ignoring Error Channels

Always map errors to typed domain errors. Leaving errors as `ParseError` or `Error` bypasses the
structured error system and breaks `errorToHttpResponse` mapping.

```typescript
// ❌ Wrong: raw ParseError leaks out of the effect
const validated = yield* Schema.decodeUnknown(UserSchema)(body);

// ✅ Correct: map to typed ValidationError
const validated = yield* Schema.decodeUnknown(UserSchema)(body).pipe(
  Effect.mapError((e) => new ValidationError({ message: Schema.formatIssueSync(e) })),
);
```

---

<a id="refactoring-promise-to-effect"></a>

## Refactoring Promise-Returning Functions to Effect

When converting existing `async function(): Promise<T>` service functions to Effect, follow this
structured approach.

**Identify scope:** Start with service functions (not HTTP handlers, which use `handleHttpEndpoint`
directly). Prioritize functions with complex async boundaries or multiple error paths.

**Step 1: Update signature and wrap in Effect.gen**

```typescript
// Before
export default async function getUser(id: string): Promise<User> {

// After
export default function getUser(id: string): Effect.Effect<User, DatabaseError | NotFoundError> {
  return Effect.gen(function* getUserGen() {
```

**Step 2: Replace await with yield* and Effect.tryPromise**

```typescript
// Before
const user = await db.query("SELECT * FROM users WHERE id = $1", [id]);

// After
const user = yield* Effect.tryPromise({
  try: () => db.query("SELECT * FROM users WHERE id = $1", [id]),
  catch: (error) =>
    new DatabaseError({
      message: `Query failed: ${error instanceof Error ? error.message : String(error)}`,
    }),
});
```

**Step 3: Replace throw with Effect.fail**

```typescript
// Before
if (!user) {
  throw new Error("User not found");
}

// After
if (!user) {
  yield* Effect.fail(
    new NotFoundError({
      resource: "User",
      id,
    }),
  );
}
```

**Step 4: Handle TypeScript type narrowing with ?? operator**

When TypeScript doesn't narrow types through an `Effect.fail` branch, use the `?? (yield* Effect.fail(...))`
pattern to help the type checker understand that null/undefined branches are impossible:

```typescript
// After a null check that didn't use yield*, narrow the type:
const user = data.user ?? (yield* Effect.fail(
  new ServerError({ message: "user is unexpectedly null" }),
));
```

**Step 5: Update callers**

- **In tests:** Wrap Effect calls with `Effect.runPromise()`
  ```typescript
  const result = await Effect.runPromise(getUser("123"));
  ```
- **In handlers:** Use `handleHttpEndpoint` utility; it automatically runs the Effect
- **In other services:** Compose via `yield*` directly inside `Effect.gen`
- **In service implementations:** Mock Effect functions to return `Effect.succeed(value)` or `Effect.fail(error)`
  ```typescript
  vi.mocked(getUser).mockReturnValue(Effect.succeed({ id: "123", name: "Alice" }));
  ```

**Tool selection:** For simple functions with 1-2 error paths, incremental string replacement works
well. For complex functions with nested async operations or multiple error recovery paths, a full
file rewrite or using a subagent converges faster and avoids iteration cycles.

---

<a id="quick-checklist"></a>

## Quick Checklist

When writing or reviewing Effect-TS code:

- [ ] All errors defined with `Data.TaggedError` — no generic `Error` subclasses in the API
- [ ] `Effect.tryPromise` always has a `catch` returning a typed error
- [ ] No `throw` inside `Effect.gen` — use `yield* Effect.fail(...)`
- [ ] No `await` inside `Effect.gen` — use `yield* Effect.tryPromise(...)`
- [ ] Schema types extracted with `Schema.Schema.Type<typeof schema>` — not written manually
- [ ] `Schema.decodeUnknown` result mapped to `ValidationError` via `Schema.formatIssueSync`
- [ ] Handlers use `handleHttpEndpoint` — no manual `Effect.runPromise` in route files
- [ ] New error-to-status mappings added in `errorToHttpResponse`, not in handlers
- [ ] Services accessed via `yield* SongService` (DI), not imported as concrete implementations
- [ ] Layers provided at the handler level, not deep inside service methods

---

<a id="see-also"></a>

## See Also

- [TypeScript Best Practices](typescript-best-practices.md) — strict types, `as const satisfies`,
  schema type extraction
- [Effect-TS Patterns Skill](/skills/effect-ts-patterns/SKILL.md) — concise agent guide
- [Effect-TS Reference](/skills/effect-ts-patterns/references/REFERENCE.md) — combinator
  reference and service composition examples
- [Effect Documentation](https://effect.website/)
- [api/src/api-errors.ts](/api/src/api-errors.ts) — typed error classes
- [api/src/http/handleHttpEndpoint.ts](/api/src/http/handleHttpEndpoint.ts) — HTTP handler wrapper
- [api/src/http/errorToHttpResponse.ts](/api/src/http/errorToHttpResponse.ts) — error-to-status
  mapping
