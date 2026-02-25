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

_Note:_ helper modules intended solely for unit tests should be named with a `.test-util.ts` or `.test-util.tsx` suffix (singular) so their purpose is obvious and they don’t get mistaken for production code.

1. Use the included `test-template.test.ts` as a starting point for new tests.
2. Prefer descriptive test names and one behavior per test.
3. Use `vi.useFakeTimers()` only when verifying timer behavior and always restore with `vi.useRealTimers()`.

4. **RouterWrapper** – most hook tests need React Router context. Instead of copying a wrapper around every file, import `RouterWrapper` from `@/react/lib/test-utils/RouterWrapper` and pass it as the `wrapper` option to `renderHook`. Doing so avoids duplication and keeps routes consistent.
5. Mock only external dependencies such as network calls or browser APIs at the module boundary. **Simple, deterministic pure functions should be exercised with their real implementations**; mocking them just adds maintenance burden and can hide problems.
6. Leverage the growing set of shared helpers under `react/src/lib/test-utils` (e.g. `asNull`, `asNever`, `asPostgrestResponse`, `waitForAsync`, DOM event generators, `spyImport`, `makeAppSlice`).
   - For DOM events the `makeChangeEvent` helper builds a properly‑typed `React.ChangeEvent<HTMLInputElement>` so tests don’t need unsafe casts.
   - If you find yourself sprinkling `// oxlint-disable` comments around tests, consider moving that logic into a helper or fixing the underlying type mismatch; avoid in‑test disables when possible.
     Add to that folder when you need reusable boilerplate instead of inlining it in tests.
   - **Module‑level eslint-disable comments are forbidden in test and test‑util files.**
     Lint rules that conflict with transient, small helpers should be scoped to the individual line or wrapped in a block inside the function. This keeps the rest of the file clean and avoids reviewers having to hunt for wide‑ranging disables.
   - When possible, use a _typed factory_ for `vi.mock` rather than the generic parameter. Import the real module at top level and then write:

     ```ts
     vi.mock("@/api/register/buildRegisterJwt", (): { default: typeof buildRegisterJwt } => ({
       default: vi.fn(() => Effect.succeed("fake-jwt")),
     }));
     ```

     This satisfies the `jest/no-untyped-mock-factory` rule without needing any eslint disable comments or a dynamic `import()` type.

   - When you need to stub complex platform types (e.g. a tiny Hono `Context`), define a narrow “dummy” type that lists only the properties your tests actually read. Create a helper returning that type and cast the final `RegistrationRedirectParams` or similar with `as unknown as`. That way the rest of the spec remains typed and lint‑clean without resorting to `any` or broad disables.

- If a module under test (such as an OAuth callback factory) grows large and contains independent pieces of logic, extract those pieces into their own files and give them focused unit tests. For example, computing a redirect URI or cookie attribute string can live in a helper which both the main factory and its registration branch import. This keeps the primary file shorter and simplifies testing.
- **Helper modules should not contain top‑level `vi.mock` calls.**
  Instead export a callable function (e.g. `mockFoo()`) that uses `vi.doMock` or `vi.mock` when invoked, and provide accessors for the mocked functions.
  This mirrors patterns in `react/src/form/test-util.ts` and `react/src/lib/supabase/client/getSupabaseClient.test-util.ts` and prevents hoisting surprises.
- When you need a tiny fake `ReadonlyContext` for API handler tests, create a dedicated helper that constructs only the fields used by the helper under test. Document it with JSDoc and, if you must cast, scope any eslint disables _only to the single cast expression_ rather than the whole file. Example pattern:
  ```ts
  /**
   * Return a minimal ReadonlyContext for CSRF tests.
   * @param headerValue value returned by `req.header`
   * @param cookieValue cookie string or undefined
   */
  function makeCtx(headerValue?: string, cookieValue?: string): ReadonlyContext {
    const headers = new Headers();
    if (cookieValue) headers.set("Cookie", `${csrfTokenCookieName}=${cookieValue}`);
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
    return { req: { header: () => headerValue, raw: { headers } } } as unknown as ReadonlyContext;
  }
  ```
  This keeps the rest of the test file lint-clean and makes intent explicit.

7. Run `npm run lint && npx tsc -b . && npm run test:unit -- <file> --coverage` to validate formatting, types, and tests.
8. Prefer asserting against mock data variables (not duplicated literal strings). Define constants for mock inputs (e.g., `const songId = "s1"`) and use those variables in both setup and expectations to avoid mismatches and improve test clarity.

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

- **Proactively check for existing mocks**: Before creating local mocks for external services (Supabase, Effect, etc.), check `api/src/test-utils/` and its `supabase-mocks/` subfolder.
- **`mockCreateSupabaseClient(mockedFn, opts)`** — Standard way to mock the Supabase client. It accepts a typed options object that configures behavior across multiple tables.
- **`makeCtx(opts)`** — Creates a minimal `ReadonlyContext` for tests. Pass `env` overrides or `resHeadersAppend` spies.
- **`makeSupabaseClient(opts)`** — Creates a fake Supabase client. Pass mock rows or errors (e.g., `userDeleteRows`, `userInsertError`).
- **`makeSimpleClient(opts)`** — Default-exported helper for a minimal fake Supabase client. Pass an object with optional `result`, `error`, and `reject` properties; when `reject` is true the promise returned by `single()` will throw (using `error` as the thrown value). Located in `@/api/test-utils/makeSupabaseClient.simple.test-util`; use it for endpoints that only need to exercise one update/query and you don’t want the full `makeSupabaseClient.mock` dependency.

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

### MockRow<T> and strict TypeScript

The project uses `exactOptionalPropertyTypes: true`. When creating mock data, use the `MockRow<T>` utility type from `@/api/test-utils/supabase-mocks/supabase-mock-types`. This type explicitly allows `null | undefined` for all properties, which correctly mirrors Supabase's nullable columns while satisfying the strict compiler.

```typescript
import { type MockRow } from "@/api/test-utils/supabase-mocks/supabase-mock-types";
import { type Playlist } from "@/shared/generated/supabaseSchemas";

const myMockRow: MockRow<Playlist> = {
  playlist_id: "uuid",
  public_notes: undefined, // OK with MockRow even if required in schema
};
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

## Reusable Test Helper Patterns

### Callable Mock Setup Functions

When creating shared test helper modules (e.g., helpers for mocking hooks or services across multiple test files), structure them as **callable functions** rather than auto-executing module-level code:

```typescript
// react/src/event/manage/test-utils/mockUseSlideManagerView.ts
import { vi } from "vitest";

let mockFn: ReturnType<typeof vi.fn> | undefined = undefined;

/**
 * Set up the mock for useSlideManagerView.
 * Must be called explicitly in each test before using the hook.
 * @returns The mock function for inspection
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules(); // Clear module cache for fresh state
  mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockFn,
  }));
  return mockFn;
}

/**
 * Get the current mock function (used by setters).
 * @returns The mock function if set up, undefined otherwise
 */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockFn;
}
```

**Benefits:**

- ✅ Setup is explicit, not hidden at module load
- ✅ Easy to reset per test; `vi.resetModules()` ensures clean state
- ✅ Tests are self-documenting: you see `mockUseSlideManagerView()` called
- ✅ No cross-test pollution when tests run in any order

**Test usage:**

```typescript
it("updates state correctly", async () => {
  mockUseSlideManagerView(); // Explicit setup call
  setUseSlideManagerViewReturn(fakeState); // Then configure
  // ... test assertions
});
```

**Why not module-level side effects:**

---

### Avoid lifecycle hooks in unit tests

We recently consolidated a pattern for tests that need to install mocks and
then import modules that depend on those mocks. The lint rule `jest/no-hooks`
is enabled and will error whenever a `beforeAll`/`beforeEach`/`after*` hook
appears anywhere in a test file, so instead of relying on hooks we recommend
putting all setup into an `async init()` helper defined inside the
`describe` block.

```ts
describe("foo handler", () => {
  async function init() {
    vi.resetModules();              // clear cache for fresh imports
    mockFoo();                       // install any doMocks

    const { default: handler } = await import("./fooHandler");
    const { foo } = await import("./foo");

    const mockedFoo = vi.mocked(foo);
    return { handler, mockedFoo };
  }

  it("works", async () => {
    const { handler, mockedFoo } = await init();
    mockedFoo.mockReturnValue(42);

    const res = handler();
    expect(res).toBe(42);
  });
});
```

This keeps each spec self-contained, avoids shared state between tests, and
fits cleanly with existing lint rules. You can still `vi.resetAllMocks()` or
other per-test resets inside the test body as needed.

---

### Typed mock retrieval helpers

Sometimes tests need a strongly‑typed reference to a mocked module that also
uses generics. A convenient pattern is to export a helper from your shared
test-util which does the import and casts once, catching any `any` complaints
in a single place rather than in every test.

```ts
// in test-util.ts
export async function getValidateFormEffectMock(): Promise<ValidateFormEffectMock> {
  const { default: _validateFormEffect } =
    await import("@/shared/validation/validateFormEffect");
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
  return vi.mocked(_validateFormEffect) as unknown as ValidateFormEffectMock;
}
```

Tests then simply `await getValidateFormEffectMock()` after calling the
`mockValidateFormEffect()` setup helper. The disable comment is contained in
the util file, keeping test files lint-clean.

---

- ❌ Mock setup hidden at import time (unclear dependencies)
- ❌ Hard to reset between tests (state leaks)
- ❌ Test order becomes fragile
- ❌ Harder to disable/modify for specific tests

### Global Mock Storage Pattern

When multiple helpers share a mock, use Vitest's `vi.hoisted()` to create an encapsulated scope that persists across the test—no module-level variables needed:

```typescript
// mockUseSlideManagerView.ts: stores mock state via vi.hoisted()
import { vi } from "vitest";

const mockState = vi.hoisted(
  () =>
    ({
      mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
    }),
);

export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules();
  mockState.mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockState.mockFn,
  }));
  return mockState.mockFn;
}

export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockState.mockFn;
}
```

```typescript
// setUseSlideManagerViewReturn.ts: retrieves and configures the mock
import { getMockFn } from "./mockUseSlideManagerView";

export default function setUseSlideManagerViewReturn(
  val: UseSlideManagerViewResult,
): void {
  const mockFn = getMockFn();
  if (!mockFn) {
    throw new Error("Mock not set up. Call mockUseSlideManagerView() first.");
  }
  mockFn.mockReturnValue(val);
}
```

**Why `vi.hoisted()`:**

- ✅ Idiomatic Vitest pattern for shared mock state
- ✅ Encapsulated scope (not exposed as module-level variable)
- ✅ Automatically available in the test scope
- ✅ Cleaner than raw `let` declarations

This pattern keeps concerns separated while allowing helpers to coordinate without exposed module-level state.

### See Also

- [**effect-ts-patterns skill**](../effect-ts-patterns/SKILL.md) — Error handling, Effect.gen, schema validation, dependency injection patterns
- **Example test file:** `api/src/account/accountDelete.test.ts` — Implementation of patterns above

## Common Pitfalls

- **Avoid magic numbers** – hundreds of tests have gotten noisy due to bare `1`, `0`, `42` etc. When you need a literal in an expectation or return value, extract it to a named constant or use a shared helper (e.g. `const expectedOnce = 1`, or import `ZERO` from shared constants). This keeps the intent clear, satisfies `no-magic-numbers` lint when enabled, and makes it easier to update if the value ever changes.

- **Lint rule gaps** – some rules referenced in tests (`@typescript-eslint/no-magic-numbers`, `@typescript-eslint/no-unsafe-type-assertion`, etc.) aren’t actually enabled in the config, which can trigger meaningless warnings or require disables. If you see these messages in CI, don’t add a disable; instead file a repo issue so the rule can be added or the comment removed.
- **`jest/no-untyped-mock-factory` warnings** – the jest/vitest plugin complains when you call `vi.mock()` without a generic parameter. Those generics often conflict with our TypeScript setup, so it’s safe to suppress the rule at the point where the mock is defined (preferably in a shared helper rather than at the top of every test). Example:

  ```ts
  // in react/src/event/manage/test-utils.ts
  export function mockUseSlideManagerView(): void {
      // oxlint-disable-next-line jest/no-untyped-mock-factory
      vi.doMock("./useSlideManagerView", () => ({ default: vi.fn() }));
  }
  ```

  This keeps test files free of module‑level disables and centralizes the
  exception. If you really must mock inline, disable the rule on that line and
  include a comment explaining why.

### ❌ Brittle tests with `as any`

Avoid using `as any` or unsafe type assertions in test bodies, especially in assertions. These make tests brittle and hide type errors.

**✅ Better:** Use type guards or check for property existence:

```typescript
function publicNotes(res: unknown): unknown {
  if (typeof res === "object" && res !== null && "public_notes" in res) {
    return (res as { public_notes: unknown }).public_notes;
  }
  return undefined;
}

// In test:
expect(publicNotes(res)).toBeUndefined();
```

### ❌ Manual global overrides

Avoid manually assigning to `global.crypto` or other built-ins.

**✅ Better:** Use Vitest's `vi.stubGlobal`:

```typescript
// BAD: global.crypto = { randomUUID: () => '...' } as any;

// GOOD:
vi.stubGlobal("crypto", { randomUUID: () => "generated-uuid" });
```

### Mirror real failure modes

When mocking external services like Supabase, ensure the mock structure matches the real library's response format, especially for error cases. Supabase functions usually return `{ data, error }`.

```typescript
// Supabase mock returning an error object
return Promise.resolve({
  data: null,
  error: { message: "Database failure" },
});
```

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

**Helper template**: copy these examples into your tests or reuse the helpers directly — see `react/src/lib/test-utils/test-helper-template.ts` for `getCachedUserTokenSpy` and `makeUnsafeMock`. Helpers may also be co-located with the module they support; e.g. `getCachedUserToken.test-util.ts` lives in the same folder as `token-cache.ts` so tests nearby can import it with a simple relative path. Conversely, generic helpers that are reused across many tests belong under `react/src/lib/test-utils` — for example, `restoreFetch.test-util.ts` centralizes logic for resetting a stubbed `fetch` global. (pure validators like `parseUserSessionData` generally don't need mocks.)

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
