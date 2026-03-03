---
name: unit-testing-mocking-esm
description: ESM and Effect-TS mocking patterns for Vitest tests. Covers avoiding top-level mock state, mocking Effect return values, the async init() pattern, lifecycle hook avoidance, and Zustand getState spy. Use when mocking modules that return Effects, when you need fresh module imports per test, or when you need to avoid beforeEach/beforeAll.
license: MIT
compatibility: Vitest 1.x, Effect 3.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — ESM & Effect Mocking

Patterns for ESM and Effect-TS mocking in Vitest tests.

For core `vi.mock` / `vi.spyOn` basics see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).
For shared callable helper infrastructure see [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md).

---

## Avoid Top-Level Mock State

Declaring mutable variables (e.g., `let appState`) at the top level triggers `jest/require-hook`. Arrange mock state directly inside each `it` block using local constants instead.

```ts
// ❌ triggers jest/require-hook
let appState = {};

// ✅ arrange inside the test
it("works", async () => {
  const appState = {};
  vi.mocked(myFn).mockReturnValue(appState);
  // ...
});
```

---

## Mocking Effects

In ESM environments, `vi.spyOn(Effect, "runPromise")` may fail with `TypeError: Cannot redefine property`. Instead, have your mocked dependency return a **spy Effect** that captures calls without replacing the Effect runtime:

```ts
const effectSpy = vi.fn();
vi.mocked(mockedFetch).mockReturnValue(Effect.sync(() => effectSpy()));
// ... exercise the unit under test ...
expect(effectSpy).toHaveBeenCalled();
```

---

## Using `forceCast` for Complex Mocks

When mocking Zustand stores or objects with large interfaces, use `@/react/lib/test-utils/forceCast` to coerce your mock state into the required shape — keeps tests lint-clean without `any`.

```ts
import forceCast from "@/react/lib/test-utils/forceCast";
import useAppStore from "@/react/app-store/useAppStore";

vi.mock("@/react/app-store/useAppStore");

it("reads from the store", () => {
  vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
    forceCast<ReturnType<typeof selector>>(mockState),
  );
  // ...
});
```

---

## Avoid Lifecycle Hooks

The lint rule `jest/no-hooks` is enabled and will error on `beforeAll`/`beforeEach`/`after*` hooks. Use an **`async init()` helper** inside the `describe` block instead:

```ts
describe("foo handler", () => {
  async function init() {
    vi.resetModules();   // clear module registry for fresh imports
    mockFoo();           // install any vi.doMock calls

    const { default: handler } = await import("./fooHandler");
    const { foo } = await import("./foo");
    return { handler, mockedFoo: vi.mocked(foo) };
  }

  it("calls foo with the expected argument", async () => {
    const { handler, mockedFoo } = await init();
    mockedFoo.mockReturnValue(42);

    const res = handler();

    expect(res).toBe(42);
  });
});
```

Key points:

- `vi.resetModules()` must be called before dynamic imports so each test gets a fresh module instance.
- Return everything the test needs from `init()` — don't rely on outer-scope `let` assignments.
- This is equivalent to a typed `beforeEach` + `afterEach` but passes lint.

---

## Mocking Static Properties on Zustand Stores (`useAppStore.getState`)

Zustand exposes `getState` as a static property on the hook function — the auto-mock does **not** stub it. Use `vi.spyOn` before `renderHook`:

```ts
vi.mock("@/react/app-store/useAppStore");

it("passes getState to the subscribe function", async () => {
  vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

  renderHook(() => { mySubscriptionHook("community-1"); });

  await waitFor(() => {
    // Exact reference — not expect.any(Function) — catches regressions
    expect(vi.mocked(mySubscribeFn)).toHaveBeenCalledWith("community-1", useAppStore.getState);
  });
});
```

Use `forceCast({})` from `react/src/lib/test-utils/forceCast.ts` to stay lint-clean.

---

## See Also

- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — Core `vi.mock`, `vi.spyOn`, Supabase, clearing/resetting
- [**unit-testing-mocking-helpers**](../unit-testing-mocking-helpers/SKILL.md) — Callable helper functions, `vi.hoisted()`, typed retrieval
- [**unit-testing-hooks-subscriptions**](../unit-testing-hooks-subscriptions/SKILL.md) — Effect-based subscription hooks: void hooks, `getState` spy, cleanup
- [**unit-testing-pitfalls**](../unit-testing-pitfalls/SKILL.md) — Behavioral and async anti-patterns
