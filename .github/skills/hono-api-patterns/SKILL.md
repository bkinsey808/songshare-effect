---
name: hono-api-patterns
description: Hono API route handlers, middleware patterns, request/response handling, and integration with Effect-TS. Use when building API endpoints, implementing middleware, handling errors, or validating request data.
compatibility: Hono 4.x, Effect 3.x, TypeScript 5.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.1"
---

# Hono API Patterns Skill

## Use When

Use this skill when:
- Creating or editing Hono route handlers, middleware, or request/response logic in `api/`.
- Implementing endpoint validation and error handling for Effect-based HTTP flows.

Execution workflow:
1. Keep endpoint logic in Effect and route through shared HTTP helpers.
2. Validate request input with feature-local schemas and map failures to typed errors.
3. Reuse existing middleware and error mapping patterns before creating new abstractions.
4. Validate with `npm run lint` and targeted tests for changed handlers/middleware.

Output requirements:
- Summarize endpoint/middleware changes and which shared patterns were used.
- Note any new error mapping or validation behavior introduced.

## Key Patterns

### 1. Integration with Effect-TS

The project provides `handleHttpEndpoint` (in `api/src/http/`) which runs an Effect and converts typed errors to HTTP `Response` objects via `errorToHttpResponse`:

```typescript
// api/src/song/songHandler.ts
import { Effect } from "effect";
import { handleHttpEndpoint } from "@/api/http/handleHttpEndpoint";
import { ValidationError } from "@/api/api-errors";

app.post("/songs", async (c: Context) => {
  const songEffect = Effect.gen(function* () {
    const body = yield* Effect.tryPromise({
      try: () => c.req.json(),
      catch: () => new ValidationError({ message: "Invalid JSON" }),
    });
    // ... rest of effect
    return result;
  });

  return handleHttpEndpoint(() => songEffect)(c);
});
````

### 2. Request Validation with Effect Schema

Schemas live per feature (e.g. `api/src/song/songSchemas.ts`), not in a central file:

```typescript
// api/src/song/songSchemas.ts
import { Schema } from "effect";

export const CreateSongSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  artist: Schema.String.pipe(Schema.minLength(1)),
  duration: Schema.Number.pipe(Schema.positive()),
});
```

Decode in the handler:

```typescript
const validated = yield* Schema.decodeUnknown(CreateSongSchema)(body).pipe(
  Effect.mapError((error) => new ValidationError({ message: error.message })),
);
```

### 3. Error Types

Typed errors live in `api/src/api-errors.ts` (not `errors.ts`):

```typescript
// api/src/api-errors.ts
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError") {
  constructor(readonly message: string) { super(); }
}

export class NotFoundError extends Data.TaggedError("NotFoundError") {
  constructor(readonly resource: string, readonly id: string) { super(); }
}
```

Map in `app.onError`:

```typescript
app.onError((error, c: Context) => {
  if (error instanceof ValidationError) return c.json({ error: error.message }, 400);
  if (error instanceof NotFoundError) return c.json({ error: `${error.resource} ${error.id} not found` }, 404);
  return c.json({ error: "Internal server error" }, 500);
});
```

### 4. Middleware

Existing middleware lives in `api/src/middleware/` — currently `cors.ts` and `handleAppError.ts`. Pattern:

```typescript
// api/src/middleware/handleAppError.ts
import { type Context, type Next } from "hono";

export async function handleAppError(c: Context, next: Next): Promise<void> {
  await next();
  // post-processing
}
```

### 5. JSON Parsing — Always Wrap in Effect

```typescript
// ❌ Bad: can throw
const body = c.req.json();

// ✅ Good: typed error
const body = yield* Effect.tryPromise({
  try: () => c.req.json(),
  catch: () => new ValidationError({ message: "Invalid JSON" }),
});
```

## Response Conventions

| Situation    | Status | Example                         |
| ------------ | ------ | ------------------------------- |
| Created      | 201    | `c.json({ data: song }, 201)`   |
| No content   | 204    | `c.text("", 204)`               |
| Bad input    | 400    | `c.json({ error: "..." }, 400)` |
| Not found    | 404    | `c.json({ error: "..." }, 404)` |
| Server error | 500    | `c.json({ error: "..." }, 500)` |

Keep response shapes consistent — define schemas and reuse them.

## Validation Commands

```bash
npx tsc -b api/   # Type check
npm run lint
npm run test:unit
npm run dev:api   # Then: curl http://localhost:8787/health
```

## References

- Effect-TS patterns: [../effect-ts-patterns/SKILL.md](../effect-ts-patterns/SKILL.md)
- Unit testing API handlers: [unit-testing skill](../unit-testing/SKILL.md) — see API Handler Testing section in [docs/unit-testing.md](../../../docs/unit-testing.md)
- Hono docs: https://hono.dev/
- Project rules: [.agent/rules.md](../../../.agent/rules.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If handlers/services use Effect composition, also load `effect-ts-patterns`.
- If endpoints depend on auth token semantics, also load `authentication-system`.
