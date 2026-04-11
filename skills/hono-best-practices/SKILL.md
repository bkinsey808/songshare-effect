---
name: hono-best-practices
description: >
  Hono route handlers, Effect-TS integration, error mapping, middleware, validation,
  and architectural conventions for the API layer (`api/`). Use when creating or editing
  any handler, middleware, or route registration. Supersedes the former hono-api-patterns skill.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

**Full reference:** [/docs/server/hono-best-practices.md](/docs/server/hono-best-practices.md)

**Add-endpoint workflow:** Read [`.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md) before writing any handler code.

**Companion skills (load on demand):**
- Effect-TS fiber/generator patterns → [effect-ts-patterns/SKILL.md](/skills/effect-ts-patterns/SKILL.md)
- Auth token verification → [authentication-system/SKILL.md](/skills/authentication-system/SKILL.md)
- Unit testing handlers → [unit-test-best-practices/SKILL.md](/skills/unit-test-best-practices/SKILL.md)
- Lint failures → [lint-error-resolution/SKILL.md](/skills/lint-error-resolution/SKILL.md)

## Preconditions

- Read the add-endpoint workflow doc before writing any handler.
- Check `.agent/rules.md` for repo-wide constraints.

## Execution workflow

1. Read [`.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md).
2. Place schemas in `shared/src/validation/` — never in `api/src/`.
3. Keep endpoint logic in Effect; route through `handleHttpEndpoint`.
4. Validate input with `decodeUnknownSyncOrThrow` + dedicated extract function.
5. Reuse existing middleware before creating new abstractions.
6. Run `npm run lint` — do not skip.

## Key rules

- **Handlers, not controllers** — one handler function per action file; no class-based controllers. Path-param type inference breaks inside classes.
  [→ full detail](/docs/server/hono-best-practices.md#handlers-not-controllers)

- **`ReadonlyContext`** — never `Context<{ Bindings: Bindings }>`.
  [→ full detail](/docs/server/hono-best-practices.md#handler-signature)

- **`handleHttpEndpoint`** — all Effect handlers register through this wrapper in `server.ts`.
  [→ full detail](/docs/server/hono-best-practices.md#file-registration)

- **Path constants only** — import from `shared/src/paths.ts`; never hardcode route strings.
  [→ full detail](/docs/server/hono-best-practices.md#file-registration)

- **Keep handlers thin** — HTTP glue only; business logic in pure service functions with no Hono imports.
  [→ full detail](/docs/server/hono-best-practices.md#thin-handlers)

- **Extract function for validation** — schema in `shared/src/validation/`, `decodeUnknownSyncOrThrow` in a dedicated `extract*.ts`; catch and fail with `ValidationError`.
  [→ full detail](/docs/server/hono-best-practices.md#request-validation)

- **Throw inside Supabase `try`** — throw on `result.error` inside the `try` callback so one `catch` handles all branches; prevents "all if-else branches same code" lint error.
  [→ full detail](/docs/server/hono-best-practices.md#supabase-errors)

- **Always check ownership** — fetch `user_id` from DB and compare before any mutation.
  [→ full detail](/docs/server/hono-best-practices.md#ownership-checks)

- **No `client as any`** — use typed `if/else` chains or a shared helper for dynamic table names.
  [→ full detail](/docs/server/hono-best-practices.md#dynamic-tables)

- **Descriptive query-param variable names** — minimum 2 characters (`id-length` rule).
  [→ full detail](/docs/server/hono-best-practices.md#query-params)

- **Correct error class** — `ValidationError`→400, `AuthenticationError`→401, `AuthorizationError`→403, `NotFoundError`→404, `DatabaseError`→500.
  [→ full detail](/docs/server/hono-best-practices.md#error-classes)

- **`app.route()` for scale** — mount feature sub-apps; don't grow `server.ts` unboundedly.
  [→ full detail](/docs/server/hono-best-practices.md#route-grouping)

- **Typed context variables** — define `AppVariables` and pass `Hono<{ Variables: AppVariables }>` when middleware sets values handlers need.
  [→ full detail](/docs/server/hono-best-practices.md#typed-context)

- **Global handlers** — register `app.onError()` and `app.notFound()` after all route definitions.
  [→ full detail](/docs/server/hono-best-practices.md#global-handlers)

- **Test with `app.request()`** — exercises the full Hono stack; prefer over constructing mock contexts.
  [→ full detail](/docs/server/hono-best-practices.md#testing)

## Output format

Write code changes directly. After edits, output a brief bullet list of which conventions were applied and which validation commands were run.

## Error handling

- If `npm run lint` or `npx tsc -p api/tsconfig.json --noEmit` fails, report verbatim and fix before declaring success.
- If a lint error pattern is not obvious, load `lint-error-resolution`.

## Validation

```bash
npx tsc -p api/tsconfig.json --noEmit   # type-check API only
npm run lint                             # full lint suite
```

## Evaluations (I/O examples)

**Input:** "Add a DELETE /api/songs/:id endpoint"
**Expected:** Reads add-api-endpoint workflow, creates `api/src/songs/delete/deleteSongHandler.ts` using `ReadonlyContext`, creates extract function in `api/src/songs/delete/extractDeleteSongRequest.ts`, adds path constant to `shared/src/paths.ts`, registers in `server.ts` via `handleHttpEndpoint`, runs lint and tsc.

**Input:** "Why does my Supabase insert return an error even though the tryPromise catch isn't firing?"
**Expected:** Explains that Supabase puts errors in the response object, not as thrown exceptions; must `throw result.error` inside the `try` callback so the `catch` branch sees it.

**Input:** "Add middleware that attaches a request ID to every request"
**Expected:** Defines `AppVariables` type with `requestId: string`, passes it as `Hono<{ Variables: AppVariables }>`, creates middleware using `c.set('requestId', crypto.randomUUID())`, registers with `app.use('*', ...)`.

## Do not

- Use `Context<{ Bindings: Bindings }>` — use `ReadonlyContext`.
- Put schemas in `api/src/` — they belong in `shared/src/validation/`.
- Use `client as any` for dynamic table names.
- Hardcode route strings — always use path constants.
- Run `npx eslint` directly — always `npm run lint`.
- Add broad lint/type suppressions without explicit justification.
- Violate repo-wide rules in `.agent/rules.md`.

## Skill handoffs

- Effect-TS patterns → load `effect-ts-patterns`.
- Auth token verification → load `authentication-system`.
- Lint errors → load `lint-error-resolution`.
- Unit testing handlers → load `unit-test-best-practices`.
