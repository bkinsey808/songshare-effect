---
name: unit-testing-mocking-helpers
description: Shared mock helper infrastructure for Vitest tests. Covers when to extract callable mock functions, the vi.hoisted() encapsulation pattern, typed mock retrieval helpers for generic modules, and helper module rules. Use when two or more test files need the same mock, or when building a shared test-util file.
license: MIT
compatibility: Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Shared Mock Helper Infrastructure

Patterns for building and organizing shared mock helpers.

For core `vi.mock` / `vi.spyOn` basics see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).
For ESM/Effect mocking and the `init()` pattern see [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md).

---

## Which Mock Setup Pattern to Use

Three patterns exist; pick the right one upfront to avoid rewrites:

| Situation                                            | Pattern                                     | Location                   |
| ---------------------------------------------------- | ------------------------------------------- | -------------------------- |
| Single test file needs fresh module imports per test | `async init()` inside `describe`            | Inline in the test file    |
| Multiple test files mock the same module             | Callable `mockFoo()` function               | Colocated `*.test-util.ts` |
| Multiple helper files need to share mock state       | `vi.hoisted()` state + `mockFoo()` + getter | Colocated `*.test-util.ts` |

**Rule of thumb:** start with `async init()` (documented in [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md)). Extract to a callable helper only when two or more test files need the same mock. Add `vi.hoisted()` only when a second helper file needs to read or configure the same mock function.

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
 * @returns The mock function for inspection
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
 * Get the current mock function (used by setter helpers).
 * @returns The mock function if set up, undefined otherwise
 */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockFn;
}
```

**Why not module-level side effects:**

- ❌ Mock setup hidden at import time — unclear what each test depends on
- ❌ Hard to reset between tests — state leaks across test runs
- ❌ Test order becomes fragile

**Test usage:**

```typescript
it("updates state correctly", async () => {
  mockUseSlideManagerView();          // explicit setup call
  setUseSlideManagerViewReturn(fakeState);  // configure return value
  // ... assertions
});
```

---

## Global Mock Storage with `vi.hoisted()`

When multiple helper files share a single mock, use `vi.hoisted()` to create an encapsulated scope rather than a raw `let` at module top-level:

```typescript
import { vi } from "vitest";

const mockState = vi.hoisted(() => ({
  mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
}));

/**
 * Set up the mock for useSlideManagerView.
 * @returns The mock function
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules();
  mockState.mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockState.mockFn,
  }));
  return mockState.mockFn;
}

/**
 * Get the current mock function (used by setter helpers).
 */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockState.mockFn;
}
```

Configure the mock value from a separate setter helper:

```typescript
// setUseSlideManagerViewReturn.ts
import { getMockFn } from "./mockUseSlideManagerView";

/**
 * Configure the return value for the mocked useSlideManagerView.
 * @throws if mockUseSlideManagerView() has not been called first
 */
export default function setUseSlideManagerViewReturn(val: UseSlideManagerViewResult): void {
  const fn = getMockFn();
  if (!fn) {
    throw new Error("Mock not set up. Call mockUseSlideManagerView() first.");
  }
  fn.mockReturnValue(val);
}
```

**Why `vi.hoisted()`:** idiomatic Vitest API; encapsulated scope; no module-level `let` that leaks across files; cleaner than raw mutable state.

---

## Typed Mock Retrieval Helpers

When tests need a strongly-typed reference to a mocked module that also uses generics, export a retrieval helper from your shared test-util:

```ts
// in my-feature.test-util.ts
export async function getValidateFormEffectMock(): Promise<ValidateFormEffectMock> {
  const { default: validateFormEffect } =
    await import("@/shared/validation/validateFormEffect");
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
  return vi.mocked(validateFormEffect) as unknown as ValidateFormEffectMock;
}
```

Tests then `await getValidateFormEffectMock()` after calling the setup helper. The `oxlint-disable` comment is contained in the util helper, keeping test files lint-clean.

---

## Helper Module Rules

1. **No top-level `vi.mock` calls in helper modules.** Export a callable function (e.g., `mockFoo()`) that calls `vi.doMock` when invoked. Top-level `vi.mock` in a helper is hoisted unpredictably when the helper is imported.
2. **No module-level `oxlint-disable` comments** in test or test-util files. Scope any disables to a single helper function with a comment explaining why.
3. See real examples in `react/src/form/test-util.ts` and `react/src/lib/supabase/client/getSupabaseClient.test-util.ts`.

---

## Anti-pattern: dispatching mock behavior via `String(selector).includes(...)`

When mocking a selector hook like `useAppStore`, resist the temptation to inspect the selector function's source string to decide what to return:

```ts
// ❌ Fragile: breaks with minification, inlining, or function rename
mockedUseAppStore.mockImplementation((selector: unknown) => {
  const sel = String(selector);
  if (sel.includes("fetchUserLibrary")) {
    return fetchUserLibrary;
  }
  return undefined;
});
```

This pattern will silently break if the function body changes (e.g. the variable is renamed or the code is minified). It also cannot handle selectors that are arrow functions declared inline.

**Preferred approach:** invoke the selector against a typed mock state using `forceCast` to avoid the `unsafe-type-assertion` lint error:

```ts
import forceCast from "@/react/lib/test-utils/forceCast";

const mockFetchUserLibrary = vi.fn(() => Effect.sync(() => undefined));
const mockState = { fetchUserLibrary: mockFetchUserLibrary };

mockedUseAppStore.mockImplementation((selector: unknown) =>
  forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
);
```

The selector is invoked with the real argument — robust, type-safe, and minification-proof. See [unit-testing-mocking](../unit-testing-mocking/SKILL.md) for the full `installStore` pattern.

---

## See Also

- [**unit-testing-mocking**](../unit-testing-mocking/SKILL.md) — Core `vi.mock`, `vi.spyOn`, Supabase, clearing/resetting
- [**unit-testing-mocking-esm**](../unit-testing-mocking-esm/SKILL.md) — ESM/Effect, `init()`, avoiding lifecycle hooks
- [**unit-testing-pitfalls-quality**](../unit-testing-pitfalls-quality/SKILL.md) — Lint disable hygiene, type-cast helpers
