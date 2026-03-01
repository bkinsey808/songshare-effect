````skill
---
name: unit-testing-api
description: Patterns for unit-testing Effect-based Hono API handlers (server-side). Covers makeCtx, makeSupabaseClient, MockRow, and running handlers with Effect.runPromise. Use when writing tests for API handlers in the api/ directory.
license: MIT
compatibility: Vitest 1.x, Effect 3.x, Hono 4.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — API Handlers

Focused guidance for testing Effect-based Hono API handlers in `api/src/`.

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).
For mocking strategies see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).

---

## Setup: Mock External Modules

At the top of your test file, mock all imported modules (Supabase client, external handlers, utilities):

```typescript
import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";
import { AuthenticationError } from "@/api/api-errors";
import buildClearCookieHeader from "@/api/cookie/buildClearCookieHeader";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";

import accountDelete from "./accountDelete";

// Mock all external dependencies
vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/buildClearCookieHeader");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/csrf/verifySameOriginOrThrow");
vi.mock("@/api/csrf/verifyDoubleSubmitOrThrow");
// Note: makeCtx is imported from @/api/hono/makeCtx.test-util (not test-utils/)
```

---

## Test Helpers: Use Existing Factories

**Proactively check for existing mocks** in `api/src/test-utils/` and its `supabase-mocks/` subfolder before writing local stubs.

- **`mockCreateSupabaseClient(mockedFn, opts)`** — Standard way to mock the Supabase client. Accepts a typed options object configuring behavior across multiple tables.
- **`makeCtx(opts)`** — Creates a minimal `ReadonlyContext`. Pass `env` overrides or `resHeadersAppend` spies.
- **`makeSupabaseClient(opts)`** — Creates a fake Supabase client. Pass mock rows or errors (e.g., `userDeleteRows`, `userInsertError`).
- **`makeSimpleClient(opts)`** — Minimal fake client for endpoints that only exercise one update/query. Pass `{ result, error, reject }` where `reject: true` makes `single()` throw. Located at `@/api/test-utils/makeSimpleSupabaseClient.test-util`.

```typescript
const ctx = makeCtx({
  env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
  resHeadersAppend: vi.fn(), // Spy to assert cookie headers
});

// Use standard mock factory
mockCreateSupabaseClient(vi.mocked(createClient), {
  playlistSelectSingleRow: { user_id: "requester-1" },
  playlistDeleteError: new Error("boom"),
});
```

---

## `MockRow<T>` and Strict TypeScript

The project uses `exactOptionalPropertyTypes: true`. Use `MockRow<T>` from `@/api/test-utils/supabase-mocks/supabase-mock-types` — it explicitly allows `null | undefined` for all properties, correctly mirroring Supabase nullable columns under the strict compiler.

```typescript
import { type MockRow } from "@/api/test-utils/supabase-mocks/supabase-mock-types";
import { type Playlist } from "@/shared/generated/supabaseSchemas";

const myMockRow: MockRow<Playlist> = {
  playlist_id: "uuid",
  public_notes: undefined, // OK with MockRow even if required in schema
};
```

---

## Mocking Effect Functions

**Static mocks** (simple side effects like CSRF checks):

```typescript
vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);
```

**Dynamic imports with `vi.spyOn`** (for functions returning Effects):

Handlers like `getVerifiedUserSession` return `Effect.Effect<UserSessionData, ...>`. Mock them by:

1. Importing the module at runtime (`await import(...)`)
2. Spying on its default export
3. Returning a mocked Effect:

```typescript
const verifiedModule = await import("@/api/user-session/getVerifiedSession");
vi.spyOn(verifiedModule, "default").mockReturnValue(
  Effect.succeed<UserSessionData>({
    user: { user_id: "123", ... },
    userPublic: { user_id: "123", username: "testuser" },
    oauthUserData: { email: "u@example.com" },
    oauthState: { csrf: "x", lang: "en", provider: "google" },
    ip: "127.0.0.1",
  }),
);

// For failure cases:
vi.spyOn(verifiedModule, "default").mockReturnValue(
  Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
);
```

---

## Running the Handler and Asserting Results

Use `Effect.runPromise()` to execute handlers and assert their output:

```typescript
// Happy path: should resolve to success response
const res = await Effect.runPromise(accountDelete(ctx));
expect(res).toStrictEqual({ success: true });
expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", "clear-cookie");

// Error case: should reject with expected error
await expect(Effect.runPromise(accountDelete(ctx))).rejects.toThrow(/Database error/);

// Early return (e.g., CSRF failure returns Response before Effect chain):
const res = await Effect.runPromise(accountDelete(ctx));
expect(res).toBeInstanceOf(Response);
expect(res.status).toBe(HTTP_FORBIDDEN);
```

---

## Complete Example

See `api/src/account/accountDelete.test.ts` for a full worked test applying all the patterns above: context setup, CSRF mocks, dynamic Effect import, DB client mock, `Effect.runPromise()` assertion, and cookie header spy.

---

## Minimal `ReadonlyContext` helper

When testing small helpers (e.g., CSRF extraction) that only read a few fields from context, create a narrow helper rather than importing `makeCtx`:

```ts
/**
 * Return a minimal ReadonlyContext for CSRF tests.
 * @param headerValue - value returned by `req.header`
 * @param cookieValue - cookie string or undefined
 */
function makeCtxForCsrf(headerValue?: string, cookieValue?: string): ReadonlyContext {
  const headers = new Headers();
  if (cookieValue) headers.set("Cookie", `${csrfTokenCookieName}=${cookieValue}`);
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
  return { req: { header: () => headerValue, raw: { headers } } } as unknown as ReadonlyContext;
}
```

Scope any `oxlint-disable` to the single cast expression; keep the rest of the file clean.

---

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — vi.mock, vi.hoisted, callable helpers
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Common anti-patterns to avoid
- [**effect-ts-patterns**](../effect-ts-patterns/SKILL.md) — Effect.gen, error types, schema validation
- **Example test:** `api/src/account/accountDelete.test.ts`
````
