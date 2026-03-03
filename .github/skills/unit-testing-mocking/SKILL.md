````skill
---
name: unit-testing-mocking
description: Core mocking patterns for Vitest tests in this repo. Covers factoryless vi.mock, vi.mocked vs vi.spyOn, Supabase/Postgrest stubs, Zustand getState spy, clearing/resetting mocks, and the type-safe checklist. For ESM/Effect patterns and lifecycle-hook avoidance see unit-testing-mocking-esm. For shared callable mock helpers and vi.hoisted patterns see unit-testing-mocking-helpers.
license: MIT
compatibility: Vitest 1.x, Effect 3.x
metadata:
  author: bkinsey808
  version: "1.1"
---

# Unit Testing — Mocking Strategies (Core)

Core mocking guidance for Vitest tests in this repo.

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).
For API handler testing see [unit-testing-api](../unit-testing-api/SKILL.md).
For ESM/Effect mocking and `init()` patterns see [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md).
For shared callable helpers and `vi.hoisted()` see [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md).

---

## Factoryless `vi.mock` Pattern (Preferred)

**Avoid typed factories.** Calling `vi.mock("path", () => ({ ... }))` triggers `jest/no-untyped-mock-factory` and breaks for Effect return types because the factory doesn't capture generic parameters.

**Preferred — single-argument `vi.mock` + `vi.mocked` at module level:**

```ts
import fetchEventCommunities from "@/react/event/fetch/fetchEventCommunities";
import subscribeToCommunityEventByEvent from "@/react/event/subscribe/subscribeToCommunityEventByEvent";

vi.mock("@/react/event/fetch/fetchEventCommunities");
vi.mock("@/react/event/subscribe/subscribeToCommunityEventByEvent");

// Module-level defaults (override per-test with .mockReturnValue in the it block)
vi.mocked(fetchEventCommunities).mockReturnValue(Effect.succeed([]));
vi.mocked(subscribeToCommunityEventByEvent).mockReturnValue(Effect.succeed(() => undefined));
```

---

## Supabase / Postgrest Mocking

Supabase queries return `PostgrestResponse<T>` shapes. Mock return values must match `{ data, error, count, status, statusText }` to keep TypeScript and linter checks happy.

- **Centralize unsafe casts** in `asPostgrestResponse(value)` under `react/src/lib/test-utils`. This helper constructs a minimal `PostgrestResponse<T>` and contains any disable comments.
- **Prefer typed mocked functions:** `vi.mocked(callSelect)` and wrap with `asPostgrestResponse(...)`.

```ts
import callSelect from '@/react/lib/supabase/client/safe-query/callSelect';
import asPostgrestResponse from '@/react/lib/test-utils/asPostgrestResponse';

vi.mock('@/react/lib/supabase/client/safe-query/callSelect');
const mockedCallSelect = vi.mocked(callSelect);

mockedCallSelect.mockResolvedValue(asPostgrestResponse({ data: [{ id: 'r1' }] }));
```

---

## `vi.mocked()` vs `vi.spyOn()` — Know the Difference

**`vi.mocked()` only works when the module has already been registered with `vi.mock()`.**

```ts
// ✅ This works because vi.mock("...") is at the top of the file
vi.mock("@/shared/utils/formatEventDate");
// Later, in a test:
vi.mocked(formatEventDate.clientLocalDateToUtcTimestamp).mockReturnValue("2026-01-01T00:00:00Z");
```

If you have NOT registered the module with `vi.mock()` at the top of the file (e.g. you imported the module dynamically inside a test), calling `vi.mocked(...).mockReturnValue(...)` will throw at runtime:

```ts
// ❌ WRONG — clientLocalDateToUtcTimestamp is not a mock function because
//            there is no top-level vi.mock("@/shared/utils/formatEventDate")
const mod = await import("@/shared/utils/formatEventDate");
vi.mocked(mod.clientLocalDateToUtcTimestamp).mockReturnValue("..."); // TypeError!
```

**Use `vi.spyOn()` when you need per-test control without a top-level `vi.mock()`:**

```ts
// ✅ Works without a top-level vi.mock — spyOn wraps the live function
const mod = await import("@/shared/utils/formatEventDate");
vi.spyOn(mod, "clientLocalDateToUtcTimestamp").mockReturnValue("2026-01-01T00:00:00Z");
```

**Rule of thumb:**

| You have a top-level `vi.mock("path")` | Use `vi.mocked(fn).mockReturnValue(...)` |
|---|---|
| No top-level `vi.mock("path")` for this module | Use `vi.spyOn(module, "fnName").mockReturnValue(...)` |

> Prefer adding a top-level `vi.mock()` when the same module needs to be controlled in multiple tests; use `vi.spyOn()` for one-off per-test overrides.

---

## Type-Safe Test Checklist (Avoid Rewrites)

- Use `forceCast<T>(obj)` from `@/react/lib/test-utils/forceCast` to build fully-typed slice/store stubs without `any`. Provide every method the production code may call.
- Use `asPostgrestResponse({ data, error: null, status: 200, statusText: 'OK' })` for Postgrest shapes — never hand-craft the object.
- Use `vi.mocked(module)` for typed mocks (requires top-level `vi.mock("path")`); use `vi.spyOn` + `await import()` for per-test overrides when the module is not top-level mocked.
- Use `undefined` for absent optional fields (not `null`).

---

## Never mock an entire shared library

Avoiding partial `vi.mock` factories for libraries like `effect` that export types used across the whole repo. Even if the factory only overrides one export, Vitest's auto-mocking will replace all other exports with `undefined`, breaking any file that imports `Schema`, `Effect`, etc.

```ts
// ❌ Replaces ALL exports with undefined — breaks Schema, Context, Layer, etc.
vi.mock("effect", () => ({
  Effect: { runPromise: vi.fn() },
}));

// ✅ Stub only at the call site using real Effect values
import { Effect } from "effect";
// Pass as a prop or argument in tests:
fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined)
// Or spy on the imported function without touching the whole module:
vi.spyOn(effectModule, "runPromise").mockResolvedValue(undefined);
```

**Rule:** only mock modules that the code under test **directly imports**. Verify with a quick `grep` before adding a `vi.mock`.

---

## Using `forceCast` for type-safe selector dispatch in `installStore`

When mocking `useAppStore` with `vi.mocked(...).mockImplementation(...)`, invoking the selector against a partial mock state triggers `@typescript-eslint/no-unsafe-type-assertion`. The correct pattern uses `forceCast` from `@/react/lib/test-utils/forceCast` to encapsulate the double-cast:

```tsx
import forceCast from "@/react/lib/test-utils/forceCast";

const mockFetchUserLibrary = vi.fn(() => Effect.sync(() => undefined));
const mockState = { fetchUserLibrary: mockFetchUserLibrary };

function installStore() {
  mockedUseAppStore.mockImplementation((selector: unknown) =>
    // forceCast wraps the double assertion; keeps the call-site lint-clean
    forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
  );
  return { fetchUserLibrary: mockFetchUserLibrary };
}
```

This invokes the **real selector function** against the typed mock state — avoiding fragile `String(selector).includes(...)` string inspection and unsafe inline casts.

---

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-mocking-esm**](../unit-testing-mocking-esm/SKILL.md) — ESM/Effect patterns, `init()`, lifecycle hook avoidance
- [**unit-testing-mocking-helpers**](../unit-testing-mocking-helpers/SKILL.md) — Callable helper functions, `vi.hoisted()`, typed retrieval, helper module rules
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Hono API handler testing
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Behavioral and async anti-patterns
- [**unit-testing-pitfalls-quality**](../unit-testing-pitfalls-quality/SKILL.md) — Lint disables, type-cast helpers, `toStrictEqual`, `toSorted()`
````
