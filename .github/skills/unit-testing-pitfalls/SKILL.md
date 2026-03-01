````skill
---
name: unit-testing-pitfalls
description: Common anti-patterns and mistakes to avoid in Vitest tests for this repo. Covers magic numbers, lint disables, `as any`, async races, `act`, duplicated literals, and type-cast helpers. Use when writing or editing any unit test to avoid introducing these patterns.
license: MIT
compatibility: Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Common Pitfalls

Anti-patterns to avoid in Vitest tests for this repo.

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).
For mocking strategies see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).

---

## ❌ Magic Numbers

Hundreds of tests have gotten noisy due to bare `1`, `0`, `42`, etc. Extract literals to named constants or use shared helpers. This keeps intent clear, satisfies `no-magic-numbers` lint when enabled, and makes updates easier.

---

## ⚠️ Lint Rule Gaps

Some rules referenced in tests (`@typescript-eslint/no-magic-numbers`, `@typescript-eslint/no-unsafe-type-assertion`, etc.) aren't actually enabled in the config, which can trigger meaningless warnings or require disables. If you see these messages in CI, don't add a disable — file a repo issue so the rule can be added or the comment removed.

---

## ⚠️ `jest/no-untyped-mock-factory`

Triggered when `vi.mock()` is called with a factory but no type parameter. **Do not suppress this with a lint disable.** Instead, use the factoryless pattern: single-argument `vi.mock("path")` plus `vi.mocked(fn).mockReturnValue(...)` at module level. See [unit-testing-mocking](../unit-testing-mocking/SKILL.md) for full examples.

---

## ❌ Brittle Tests with `as any`

Avoid `as any` or unsafe type assertions in test bodies — they hide type errors.

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

---

## ❌ Manual Global Overrides

Avoid manually assigning to `global.crypto` or other built-ins.

**✅ Better:** Use Vitest's `vi.stubGlobal`:

```typescript
// BAD: global.crypto = { randomUUID: () => '...' } as any;

// GOOD:
vi.stubGlobal("crypto", { randomUUID: () => "generated-uuid" });
```

---

## ⚠️ Mirror Real Failure Modes

When mocking external services like Supabase, ensure the mock structure matches the real library's response format, especially for error cases. Supabase functions usually return `{ data, error }`:

```typescript
return Promise.resolve({
  data: null,
  error: { message: "Database failure" },
});
```

---

## ❌ Async Race Conditions

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

---

## ⚠️ Avoid `act` from @testing-library/react

`act` calls have been causing deprecation warnings and lead to verbose, brittle tests with unsafe casts.

- Don't use `act` to simulate DOM events or construct `ChangeEvent` objects with unsafe casts.
- For async behavior, use `waitFor` (or `waitForElementToBeRemoved`) instead of wrapping updates in `act()`.

**BAD:**

```typescript
act(() => {
  // Unsafe cast and deprecated pattern
  result.current.handleInputChange(
    { target: { value: "another" } } as unknown as React.ChangeEvent<HTMLInputElement>
  );
});
```

**BETTER — set hook state directly for synchronous updates:**

```typescript
result.current.setSearchQuery("another");
result.current.setIsOpen(true);
```

**BEST — use `waitFor` for async assertions:**

```typescript
import { waitFor } from "@testing-library/react";

result.current.setSearchQuery("another");

await waitFor(() => {
  expect(result.current.filteredPlaylists.map((p) => p.playlist_id)).toStrictEqual(["p2"]);
});
```

If you find a test that still uses `act`, replace it with direct state setters or `waitFor`.

---

## ❌ Duplicated Literal Test Data

```typescript
// BAD: Duplicated literals in setup and assertions – easy to mistype
const songs = ["s1", "s2"];
await Effect.runPromise(removeUserEffect({ songsOwnedByUser: songs, ... }));
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: "s1" });
```

**✅ Better:** Define and assert against the same variables:

```typescript
const songId1 = "s1";
const songId2 = "s2";
const songs = [songId1, songId2];

await Effect.runPromise(removeUserEffect({ songsOwnedByUser: songs, ... }));
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: songId1 });
```

---

## ⚠️ Lint Disable Comments in Tests

- **Avoid file-level `/* oxlint-disable ... */`** in test files — they conceal rule violations.
- **Prefer narrow, local disables** scoped to small test helper functions rather than test bodies.
  - Use `// oxlint-disable-next-line <rule> - reason` for a single-line exception.
  - Better: place the disable above a helper function so the exception is obvious, localized, and easily audited.
- **Never scatter disables throughout test cases.** Centralize them in helpers.
- A custom oxlint rule enforces this: `oxlint-disable` comments are only permitted directly above a small helper function/constant — not inside `describe`, `test`, or `it` blocks or at file top-level.
- **Always add a brief rationale** and a `TODO`/issue reference when you add a disable.

```typescript
// BAD: file-level disable
/* oxlint-disable @typescript-eslint/no-explicit-any */

// BAD: inline disables sprinkled inside tests
it("does something", () => {
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const x: unknown = doUnsafeThing();
  expect(x).toBeDefined();
});

// BETTER: localized, documented helper
// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment -- localized in helper
export function asUnsafe<T>(value: unknown): T { return value as unknown as T; }

// Tests stay clean:
it("does something", () => {
  const x = asUnsafe<MyType>({ foo: "bar" });
  expect(x).toBeDefined();
});
```

---

## 🛠️ Type-Cast Helpers

The repo provides narrow helpers for common unsafe casts in `react/src/lib/test-utils`: `asNull`, `asNever`, `asPostgrestResponse`. Each contains its own `oxlint-disable` and JSDoc explanation so callers stay lint-friendly.

- Use the existing helpers instead of writing `as any` or sprinkling disables in tests.
- Add a new helper to the folder if you encounter a recurring pattern.

```ts
import { asNever } from "@/lib/test-utils";

it("handles unexpected value", () => {
  const bad = asNever("foo");
  expect(() => myFn(bad)).toThrow();
});
```

Generic helpers that are reused across many tests belong under `react/src/lib/test-utils`. Co-located helpers (e.g., `getCachedUserToken.test-util.ts`) live next to the module they support. See `react/src/lib/test-utils/test-helper-template.ts` for examples.

---

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — vi.mock, vi.hoisted, callable helpers
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Hono API handler testing
````
