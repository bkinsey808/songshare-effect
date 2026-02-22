---
name: unit-testing
description: Repository-specific unit testing templates and guidance for Vitest. Includes recommended patterns, mock strategies, and validation commands. Use when writing unit tests for components, hooks, and utilities.
license: MIT
compatibility: Vitest 1.x, Node.js 20+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing Skill

**What this skill does**

- Provides a lightweight Vitest test template and best-practice guidance for writing reliable, fast unit tests in this repo.
- Recommends patterns for setup, mocking external dependencies, and avoiding flaky tests.

**When to use**

- When adding or updating unit tests for components, hooks, and utilities.
- When you want a quick, consistent test template or checklist for PR reviewers.

**Step-by-step**

1. Use the included `test-template.test.ts` as a starting point for new tests.
2. Prefer descriptive test names and one behavior per test.
3. Use `vi.useFakeTimers()` only when verifying timer behavior and always restore with `vi.useRealTimers()`.
4. Mock external network calls and browser APIs at the module boundary.
5. Leverage the growing set of shared helpers under `react/src/lib/test-utils` (e.g. `asNull`, `asNever`, `asPostgrestResponse`, `waitForAsync`, DOM event generators, `spyImport`, `makeAppSlice`). Add to that folder when you need reusable boilerplate instead of inlining it in tests.
6. Run `npm run lint && npx tsc -b . && npm run test:unit -- <file> --coverage` to validate formatting, types, and tests.
7. Prefer asserting against mock data variables (not duplicated literal strings). Define constants for mock inputs (e.g., `const songId = "s1"`) and use those variables in both setup and expectations to avoid mismatches and improve test clarity.

## Examples

- See [test-template.test.ts](./test-template.test.ts) for a minimal setup and assertion pattern.

## API Testing Patterns

When testing Effect-based API handlers (e.g., `accountDelete`, `songSave`), use these patterns to mock dependencies and validate Effect results.

### Setup: Mock External Modules

At the top of your test file, mock all imported modules (Supabase client, external handlers, utilities):

```typescript
import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";
import { AuthenticationError } from "@/api/api-errors";
import buildClearCookieHeader from "@/api/cookie/buildClearCookieHeader";
import makeCtx from "@/api/test-utils/makeCtx.mock";
import makeSupabaseClient from "@/api/test-utils/makeSupabaseClient.mock";

import accountDelete from "./accountDelete";

// Mock all external dependencies
vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/buildClearCookieHeader");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/csrf/verifySameOriginOrThrow");
vi.mock("@/api/csrf/verifyDoubleSubmitOrThrow");
```

### Test Helpers: Use Existing Factories

Leverage project test helpers to keep tests DRY and typed:

- **`makeCtx(opts)`** — Creates a minimal `ReadonlyContext` for tests. Pass `env` overrides or `resHeadersAppend` spies.
- **`makeSupabaseClient(opts)`** — Creates a fake Supabase client. Pass mock rows or errors (e.g., `userDeleteRows`, `userInsertError`).

```typescript
const ctx = makeCtx({
  env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
  resHeadersAppend: vi.fn(), // Spy to assert cookie headers
});

const typedFakeClient = makeSupabaseClient({ userDeleteRows: [{ user_id: "123" }] });
vi.mocked(createClient).mockReturnValue(typedFakeClient);
```

### Mocking Effect Functions: Static Mocks vs. Dynamic Imports

**Static mocks** (simple side effects like CSRF checks):

```typescript
vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);
```

**Dynamic imports with `vi.spyOn`** (for module functions that return Effects):

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

### Running the Effect and Asserting Results

Use `Effect.runPromise()` to execute mocked handlers and assert their output:

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

### Pattern Summary

```typescript
describe("myHandler", () => {
  it("should verify auth and delete user", async () => {
    vi.resetAllMocks(); // Start fresh per test

    // 1. Create mocked context
    const appendSpy = vi.fn();
    const ctx = makeCtx({ env: {...}, resHeadersAppend: appendSpy });

    // 2. Mock dependencies (return values or Effects)
    vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
    const module = await import("@/api/user-session/getVerifiedSession");
    vi.spyOn(module, "default").mockReturnValue(Effect.succeed<UserSessionData>({...}));

    // 3. Mock DB client
    const fakeClient = makeSupabaseClient({ userDeleteRows: [{...}] });
    vi.mocked(createClient).mockReturnValue(fakeClient);

    // 4. Execute the handler
    const res = await Effect.runPromise(myHandler(ctx));

    // 5. Assert results
    expect(res).toStrictEqual({ success: true });
    expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", expect.stringContaining("session="));
  });
});
```

### See Also

- [**effect-ts-patterns skill**](../effect-ts-patterns/SKILL.md) — Error handling, Effect.gen, schema validation, dependency injection patterns
- **Example test file:** `api/src/account/accountDelete.test.ts` — Implementation of patterns above

## Common Pitfalls

### ❌ Global test state pollution

```typescript
// BAD: Shared state between tests or lifecycle hooks
let sharedData = [];

describe("MyComponent", () => {
  it("adds to array", () => {
    sharedData.push(1);
    expect(sharedData).toHaveLength(1); // Fails if test order changes
  });
});
```

**✅ Better:** Use factory helpers to set up fresh state per test:

```typescript
/** Create fresh array for this test */
const makeData = () => [];

describe("MyComponent", () => {
  it("adds to array", () => {
    const data = makeData();
    data.push(1);
    expect(data).toHaveLength(1);
  });

  it("handles empty array", () => {
    const data = makeData();
    expect(data).toHaveLength(0);
  });
});
```

This approach is more explicit, avoids hidden test dependencies, and prevents order-dependent failures. For parameterized tests, use `it.each`.

### ❌ Async test race conditions

```typescript
// BAD: Not awaiting async operations
it("fetches data", () => {
  fetchData(); // Promise not awaited
  expect(data).toBeDefined(); // May run before fetch completes
});
```

**✅ Better:** Return or await promises:

```typescript
it("fetches data", async () => {
  await fetchData();
  expect(data).toBeDefined();
});
```

### ⚠️ Avoid using `act` from @testing-library/react

`act` calls from `@testing-library/react` have been causing deprecation warnings in our test environment and can lead to verbose, brittle tests where you end up simulating browser events with unsafe casts. Prefer the Testing Library helpers and direct state updates on hook results in tests. For async behavior, use `waitFor` (or `waitForElementToBeRemoved`) to wait for expected changes instead of wrapping updates in `act()`.

- Don't use `act` to simulate DOM events or construct ChangeEvent objects with unsafe casts in tests. Instead, update hook state directly or use user-event helpers when testing DOM interactions.
- For assertions that depend on asynchronous side effects, use `await waitFor(() => ...)`.

**BAD:** using `act` with manual event casting

```typescript
act(() => {
  // Unsafe cast and deprecated pattern
  result.current.handleInputChange({ target: { value: "another" } } as unknown as React.ChangeEvent<HTMLInputElement>);
});
```

**BETTER:** set hook state directly for synchronous updates

```typescript
// Direct setter calls are clearer and avoid unsafe casts
result.current.setSearchQuery("another");
result.current.setIsOpen(true);
```

**BEST (async assertions):** use `waitFor` to assert eventual state

```typescript
import { waitFor } from "@testing-library/react";

result.current.setSearchQuery("another");

await waitFor(() => {
  expect(result.current.filteredPlaylists.map((p) => p.playlist_id)).toStrictEqual(["p2"]);
});
```

This pattern keeps tests explicit and avoids deprecated usages and unsafe type assertions. If you find a test that still uses `act`, please replace it with direct state setters or `waitFor` as shown above.

### ❌ Duplicated literal test data

```typescript
// BAD: Duplicated literals in setup and assertions – easy to mistype
const songs = ["s1", "s2"];
await Effect.runPromise(removeUserEffect({ songsOwnedByUser: songs, ... }));
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: "s1" });
```

**✅ Better:** Define and assert against variables used for mocks:

```typescript
const songId1 = "s1";
const songId2 = "s2";
const songs = [songId1, songId2];

await Effect.runPromise(removeUserEffect({ songsOwnedByUser: songs, ... }));
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: songId1 });
```

This ensures your expectations reference the same mock data declared in setup — no duplicated magic strings.

### ⚠️ Lint disable comments

- **Avoid file-level `/* oxlint-disable ... */`** in test files — they conceal rule violations and make it harder to keep tests correct.
- **Prefer narrow, local disables** when necessary, and prefer to scope them to small test helper functions rather than test bodies:
  - Use `// oxlint-disable-next-line <rule> - reason` for a single-line exception.
  - Better: place the disable above a helper function (e.g., `getCachedUserTokenSpy`, `makeUnsafeMock`) so the exception is obvious, localized, and easily audited.
- **Never scatter disables throughout test cases.** Centralize them in helpers to keep test assertions clean and to make it straightforward to remove the disable later.
- A custom oxlint rule enforces this by failing whenever an `oxlint-disable` comment appears inside a `describe`, `test`, or `it` block or anywhere at the top level of a test file. The only permitted location for a disable is directly above a small helper function/constant; that way the exception remains localized and obvious.
- **Always add a brief rationale** and a `TODO`/issue reference when you add a disable so it can be revisited and removed later.

### 🛠️ Type-cast helpers

Certain tests require unsafe casts (e.g. converting an `unknown` response into a
`PostgrestResponse<T>` or forcing a branch that accepts `never`). The repo now
provides narrow helpers for these cases in `react/src/lib/test-utils`, such as
`asNull`, `asNever`, and `asPostgrestResponse`. Each helper contains its own
`oxlint-disable` comment and JSDoc explanation so callers stay lint-friendly.
You should:

- Use the existing helpers instead of writing `as any` or sprinkling disable
  comments in tests.
- Add a new helper to the folder if you encounter a recurring pattern that
  doesn’t already have one.

Example usage:

```ts
import { asNever } from "@/lib/test-utils";

it("handles unexpected value", () => {
  const bad = asNever("foo");
  expect(() => myFn(bad)).toThrow();
});
```

```typescript
// BAD: file-level disable — avoid this
/* oxlint-disable @typescript-eslint/no-explicit-any */

// BAD: inline disables sprinkled inside tests — avoid this
it("does something", () => {
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const x: unknown = doUnsafeThing();
  expect(x).toBeDefined();
});

// BETTER: local, documented disable within a small helper so tests remain clean
// Define helper in a shared test utility file (e.g. `react/src/lib/test-utils/test-helper-template.ts`).
// The helper centralizes the unsafe cast and keeps tests free of inline disables.
// Example helper usage:
//   // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- localized and documented in helper
//   export function asUnsafe<T>(value: unknown): T { return value as unknown as T }

// Use helper in tests (keeps test code lint-friendly):
it("does something", () => {
  const x = asUnsafe<MyType>({ foo: "bar" });
  expect(x).toBeDefined();
});
```

**Helper template**: copy these examples into your tests or reuse the helpers directly — see `react/src/lib/test-utils/test-helper-template.ts` for `getCachedUserTokenSpy`, `getParseMock`, and `makeUnsafeMock`.

## Validation Commands

**When working on a single file, run tests only for that file** to get faster feedback:

```bash
# Run tests for a specific file (recommended while working on it)
npm run test:unit -- src/utils/myUtil.test.ts

# Run tests for a specific file with coverage
npm run test:unit -- src/utils/myUtil.test.ts --coverage

# Watch mode for a specific file (ideal for TDD)
npm run test:unit -- src/utils/myUtil.test.ts --watch

# Run all unit tests (before submitting PR)
npm run test:unit

# Run all tests with coverage report
npm run test:unit -- --coverage
```

## References

- Agent guidance: [.github/agents/Unit Test Agent.agent.md](../../agents/Unit Test Agent.agent.md)
- Vitest documentation: https://vitest.dev/
- Testing Library: https://testing-library.com/
