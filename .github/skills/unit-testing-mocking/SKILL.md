````skill
---
name: unit-testing-mocking
description: Mocking strategies for Vitest tests in this repo. Covers factoryless vi.mock, vi.hoisted, ESM/Effect mocking, Supabase/Postgrest stubs, callable mock helpers, avoiding lifecycle hooks, and typed retrieval helpers. Use when writing any vi.mock, vi.spyOn, or Supabase stub in a unit test.
license: MIT
compatibility: Vitest 1.x, Effect 3.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Mocking Strategies

Focused mocking guidance for Vitest tests in this repo.

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).
For API handler testing see [unit-testing-api](../unit-testing-api/SKILL.md).

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

## Type-Safe Test Checklist (Avoid Rewrites)

- Use `forceCast<T>(obj)` from `@/react/lib/test-utils/forceCast` to build fully-typed slice/store stubs without `any`. Provide every method the production code may call.
- Use `asPostgrestResponse({ data, error: null, status: 200, statusText: 'OK' })` for Postgrest shapes — never hand-craft the object.
- Use `vi.mocked(module)` for typed mocks; use `vi.spyOn` + `await import()` inside `init()` when you need per-test implementations.
- Use `undefined` for absent optional fields (not `null`).

---

## Advanced Mocking: ESM & Effect

### Avoid top-level mock state

Declaring mutable variables (e.g., `let appState`) at top level triggers `jest/require-hook`. Instead, arrange directly inside each `it` block using local constants.

### Mocking Effects

In ESM environments, `vi.spyOn(Effect, "runPromise")` may fail with `TypeError: Cannot redefine property`. Instead, have your mocked dependency return a "spy Effect":

```ts
const effectSpy = vi.fn();
mockedFetch.mockReturnValue(Effect.sync(() => effectSpy()));
// ... run test ...
expect(effectSpy).toHaveBeenCalled();
```

### Using `forceCast` for complex mocks

When mocking Zustand stores or objects with large interfaces, use `@/react/lib/test-utils/forceCast` to coerce your mock state into the required shape — keeps tests lint-clean without using `any`.

### `init()` pattern for ESM modules

See the full example under **Avoid Lifecycle Hooks** below — the same `init()` structure applies here.

---

## Avoid Lifecycle Hooks

The lint rule `jest/no-hooks` is enabled and will error on `beforeAll`/`beforeEach`/`after*` hooks. Use an `async init()` helper inside the `describe` block instead:

```ts
describe("foo handler", () => {
  async function init() {
    vi.resetModules();   // clear cache for fresh imports
    mockFoo();           // install any doMocks

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

---

## Which Mock Setup Pattern to Use

Three patterns exist; pick the right one upfront to avoid rewrites:

| Situation | Pattern | Location |
|---|---|---|
| Single test file needs fresh module imports per test | `async init()` inside `describe` | Inline in the test file |
| Multiple test files mock the same module | Callable `mockFoo()` function | Colocated `*.test-util.ts` |
| Multiple helper files need to share mock state | `vi.hoisted()` state + `mockFoo()` + getter | Colocated `*.test-util.ts` |

**Rule of thumb:** start with `async init()`. Extract to a callable helper only when two or more test files need the same mock. Add `vi.hoisted()` only when a second helper file needs to read or configure the same mock function.

---

## Callable Mock Setup Functions

When creating shared test helper modules, structure them as **callable functions** rather than auto-executing module-level code:

```typescript
// react/src/event/manage/test-utils/mockUseSlideManagerView.ts
import { vi } from "vitest";

let mockFn: ReturnType<typeof vi.fn> | undefined = undefined;

/**
 * Set up the mock for useSlideManagerView.
 * Must be called explicitly in each test before using the hook.
 * @returns - The mock function for inspection
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules();
  mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockFn,
  }));
  return mockFn;
}

/**
 * Get the current mock function (used by setters).
 * @returns - The mock function if set up, undefined otherwise
 */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockFn;
}
```

**Why not module-level side effects:**

- ❌ Mock setup hidden at import time (unclear dependencies)
- ❌ Hard to reset between tests (state leaks)
- ❌ Test order becomes fragile

**Test usage:**

```typescript
it("updates state correctly", async () => {
  mockUseSlideManagerView(); // Explicit setup call
  setUseSlideManagerViewReturn(fakeState); // Then configure
  // ... test assertions
});
```

---

## Global Mock Storage with `vi.hoisted()`

When multiple helpers share a mock, use `vi.hoisted()` to create an encapsulated scope:

```typescript
import { vi } from "vitest";

const mockState = vi.hoisted(
  () => ({
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

Configure the mock separately:

```typescript
// setUseSlideManagerViewReturn.ts
import { getMockFn } from "./mockUseSlideManagerView";

export default function setUseSlideManagerViewReturn(val: UseSlideManagerViewResult): void {
  const mockFn = getMockFn();
  if (!mockFn) {
    throw new Error("Mock not set up. Call mockUseSlideManagerView() first.");
  }
  mockFn.mockReturnValue(val);
}
```

**Why `vi.hoisted()`:** idiomatic Vitest pattern; encapsulated scope; no exposed module-level variables; cleaner than raw `let` declarations.

---

## Typed Mock Retrieval Helpers

When tests need a strongly-typed reference to a mocked module that also uses generics, export a helper from your shared test-util:

```ts
// in test-util.ts
export async function getValidateFormEffectMock(): Promise<ValidateFormEffectMock> {
  const { default: _validateFormEffect } =
    await import("@/shared/validation/validateFormEffect");
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
  return vi.mocked(_validateFormEffect) as unknown as ValidateFormEffectMock;
}
```

Tests then `await getValidateFormEffectMock()` after calling the setup helper. The disable comment is contained in the util file, keeping test files lint-clean.

---

## Helper Module Rules

- **Helper modules should not contain top-level `vi.mock` calls.** Export a callable function (e.g., `mockFoo()`) that uses `vi.doMock` or `vi.mock` when invoked. This prevents hoisting surprises.
- **Module-level eslint-disable comments are forbidden** in test and test-util files. Scope any `oxlint` disables to the individual line or a small helper function.
- See patterns in `react/src/form/test-util.ts` and `react/src/lib/supabase/client/getSupabaseClient.test-util.ts`.

---

## See Also

- [**unit-testing**](../unit-testing/SKILL.md) — Core Vitest patterns, validation commands
- [**unit-testing-api**](../unit-testing-api/SKILL.md) — Hono API handler testing
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Common anti-patterns to avoid
````
