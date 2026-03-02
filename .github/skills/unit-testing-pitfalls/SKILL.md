````skill
---
name: unit-testing-pitfalls
description: Behavioral and async anti-patterns to avoid in Vitest tests. Covers magic numbers, `as any` in tests, async races, `act`, duplicated literals, global overrides, and mirroring real failure modes. Use when writing or editing any unit test. For lint-disable hygiene, type-cast helpers, Node.js built-in mocking, and assertion quality rules see unit-testing-pitfalls-quality.
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

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — vi.mock, vi.hoisted, callable helpers
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Hono API handler testing
- [**unit-testing-pitfalls-quality**](../unit-testing-pitfalls-quality/SKILL.md) — Lint disables, type-cast helpers, mocking built-ins, `toStrictEqual`, `toSorted()`
````

`````
