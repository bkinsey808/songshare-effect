````skill
---
name: unit-testing-hooks
description: Core patterns for unit-testing React hooks in this repo. Covers renderHook-first approach, installStore helpers, one-behavior-per-test, and named constants. For Harness components see unit-testing-hooks-harness; for fixture data see unit-testing-hooks-fixtures.
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+
metadata:
  author: bkinsey808
  version: "1.1"
---

# Unit Testing — React Hooks

**Use `renderHook` by default.** Only reach for a Harness component when `renderHook` genuinely cannot simulate the required DOM interaction — see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md).

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).  
For mocking strategies see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).  
For fixture data and `forceCast` see [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md).

---

## File conventions

- Test file: **`.test.tsx`** (not `.test.ts`) for hooks, even if the hook itself is `.ts`. The `.tsx` extension is required because `renderHook` JSX, Harness components, and React type imports are often needed.
- Colocate the test next to the hook: `useMyHook.ts` → `useMyHook.test.tsx`.
- If the hook requires React Router context, pass `{ wrapper: RouterWrapper }` to `renderHook`.

---

## `renderHook` — the default approach

`renderHook` wraps the hook in a minimal React tree and gives you `result.current` to inspect return values. It handles re-renders automatically.

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useCommunitySearchInput from "./useCommunitySearchInput";

describe("useCommunitySearchInput", () => {
  it("returns empty search state initially", () => {
    installStore(mockCommunities);
    const { result } = renderHook(() =>
      useCommunitySearchInput({ activeCommunityId: undefined, onSelect: (): void => undefined }),
    );

    expect(result.current.searchQuery).toBe("");
    expect(result.current.isOpen).toBe(false);
  });
});
```

**Key rules:**

- Always read state via `result.current` — not a snapshot alias like `const hook = result.current`. After state updates `result.current` re-points to the fresh return value; a snapshot alias goes stale.
- For async state updates, wrap the trigger then `await waitFor(...)` on the assertion:

```tsx
result.current.handleInputChange(forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }));

await waitFor(() => {
  expect(result.current.searchQuery).toBe("alp");
  expect(result.current.isOpen).toBe(true);
});
```

- Do **not** use `act()` — `waitFor` from `@testing-library/react` already wraps assertions in the correct React flush cycle.

---

## Store mocking pattern — `installStore` helper

Hooks that read from `useAppStore` should use a **per-file `installStore` helper** rather than a module-level `vi.mocked(...).mockImplementation(...)` call. This keeps each test self-contained with no shared mutable state.

```tsx
import useAppStore from "@/react/app-store/useAppStore";

vi.mock("@/react/app-store/useAppStore");

function installStore(communities: CommunityEntry[]): void {
  vi.mocked(useAppStore).mockImplementation((selector: unknown) => {
    const sel = String(selector);
    if (sel.includes("communities")) {
      return communities as unknown;
    }
    return undefined;
  });
}
```

Call `installStore(...)` as the **first line of each test**, not in `beforeEach`. This makes the store state immediately visible at the test call site and avoids shared setup that obscures what a failing test depends on.

The `String(selector).includes("fieldName")` selector dispatch is intentionally simple — it mirrors the pattern used in `useEventSearchInput.test.ts` and other tests in this repo. If the real selector function property name changes, the test will catch it via a failing assertion.

---

## Effect-based subscription hooks (void hooks, cleanup, getState)

See [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md) for:
- Block arrow bodies required for `void`-returning hooks
- Module-level defaults + `vi.clearAllMocks()` pattern
- `vi.spyOn(useAppStore, "getState")` — why the auto-mock doesn't cover it
- Cleanup verification and the `undefined → defined` transition test
- Full worked example

---

## One behavior per test

Each `it` block should assert a single outcome. Split combined tests:

```tsx
// ❌ Two behaviors in one test — hard to pinpoint failures
it("select and clear work", async () => { ... });

// ✅ One behavior each
it("handleSelectCommunity calls onSelect with the community id and resets state", async () => { ... });
it("handleClearSelection calls onSelect with empty string and resets state", async () => { ... });
```

---

## Named constants — no magic numbers

Every numeric literal — including `0` and `1` — needs a named constant. Declare them at the module top level:

```tsx
const ZERO = 0;
const ONE = 1;
```

---

## Quick checklist

Before calling a hook test complete, verify:

- [ ] File is `.test.tsx`
- [ ] `renderHook` used for all state/handler tests; Harness only where real DOM interaction is required (see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md))
- [ ] `result.current` read in assertions, not a snapshot alias
- [ ] `installStore(...)` (or equivalent) called explicitly inside each test, not in `beforeEach`
- [ ] Mock data uses the real domain type — `forceCast` used instead of `as unknown as T` (see [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md))
- [ ] Fixture data is a module-level constant; not re-declared inline in each test
- [ ] Each `it` block asserts exactly one behavior
- [ ] All numeric literals are named constants
- [ ] Filter queries narrow the list — not a wildcard that matches everything
- [ ] Harness component destructures hook return; only bindings used in JSX are included (see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md))
- [ ] `waitFor` used for async assertions — `act` never used
- [ ] No `eslint-disable` comments anywhere in the test file
- [ ] No custom `assertDefined` style helpers — use `getByText`/`getByTestId` singular variants
- [ ] Subscription hooks: block arrow bodies, `getState` spy, cleanup — see [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md)
- [ ] Lint passes (`npx oxlint --config .oxlintrc.json --type-aware <file>`) before running tests

---

## References

- [unit-testing](../unit-testing/SKILL.md) — core Vitest setup and templates
- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — when/how to use a Harness, React Compiler ref constraint, query helpers
- [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, `forceCast`, shared fixture constants, filter-query specificity
- [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md) — void hooks, Effect subscriptions, getState spy, cleanup
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — `vi.mock`, `vi.mocked`, `forceCast`
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — `act`, magic numbers, async races
- [react-conventions](../react-conventions/SKILL.md) — React Compiler rules
- `@testing-library/react` docs: https://testing-library.com/docs/react-testing-library/api/#renderhook
````

