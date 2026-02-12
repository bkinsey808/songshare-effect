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
5. Run `npm run lint && npx tsc -b . && npm run test:unit -- <file> --coverage` to validate formatting, types, and tests.
6. Prefer asserting against mock data variables (not duplicated literal strings). Define constants for mock inputs (e.g., `const songId = "s1"`) and use those variables in both setup and expectations to avoid mismatches and improve test clarity.

## Examples

- See [test-template.test.ts](./test-template.test.ts) for a minimal setup and assertion pattern.

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

- **Avoid file-level `/* eslint-disable ... */`** in test files — they conceal rule violations and make it harder to keep tests correct.
- **Prefer narrow, local disables** when necessary, and prefer to scope them to small test helper functions rather than test bodies:
  - Use `// eslint-disable-next-line <rule> - reason` for a single-line exception.
  - Better: place the disable above a helper function (e.g., `getCachedUserTokenSpy`, `makeUnsafeMock`) so the exception is obvious, localized, and easily audited.
- **Never scatter disables throughout test cases.** Centralize them in helpers to keep test assertions clean and to make it straightforward to remove the disable later.
- **Always add a brief rationale** and a `TODO`/issue reference when you add a disable so it can be revisited and removed later.

```typescript
// BAD: file-level disable — avoid this
/* eslint-disable @typescript-eslint/no-explicit-any */

// BAD: inline disables sprinkled inside tests — avoid this
it("does something", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const x: unknown = doUnsafeThing();
  expect(x).toBeDefined();
});

// BETTER: local, documented disable within a small helper so tests remain clean
// Define helper in a shared test utility file (e.g. `react/src/lib/test-utils/test-helper-template.ts`).
// The helper centralizes the unsafe cast and keeps tests free of inline disables.
// Example helper usage:
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- localized and documented in helper
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
