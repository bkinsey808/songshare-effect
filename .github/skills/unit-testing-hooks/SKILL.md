````skill
---
name: unit-testing-hooks
description: Hook test bundle — entry point (load all 4 bundle skills together). Covers the dual-requirement of renderHook (behavior) + Harness (documentation), installStore helpers, and renderHook usage. For Harness details see unit-testing-hooks-harness; for lint/compiler traps see unit-testing-hooks-harness-lint; for the pre-completion checklist see unit-testing-hooks-checklist.
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+
metadata:
  author: bkinsey808
  version: "1.3"
---

# Unit Testing — React Hooks

Every hook test file should contain **both**:

1. **`renderHook` tests** — assert hook behavior in isolation. Preferred and default for all behavioral assertions.
2. **At least one Harness component** — shows how the hook is used inside real UI code ("Documentation by Harness"). Always required, even when `renderHook` covers all behavior.

If a hook test file has neither `renderHook` nor a Harness, that is a red flag: the hook may need to be refactored, or it may not warrant being a hook at all.

See [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) for full Harness guidance.

For general Vitest patterns see [unit-testing](../unit-testing/SKILL.md).
For mocking strategies see [unit-testing-mocking](../unit-testing-mocking/SKILL.md), [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md), and [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md).
For fixture data and `forceCast` see [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md).
For test-quality rules and the pre-completion checklist see [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md).

> **Load these four skills together before writing any hook test:**
> 1. **This file** — renderHook, installStore, Harness requirement summary (read first)
> 2. [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — full Harness template, completeness, cleanup, describe block ordering
> 3. [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — ⚠️ load *before* writing Harness JSX (React Compiler + oxlint traps)
> 4. [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md) — run through at the end to verify the test is complete
>
> Also load [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) when writing mock data.

---

## File conventions

- Test file: **`.test.tsx`** (not `.test.ts`) for hooks, even if the hook itself is `.ts`. The `.tsx` extension is required because `renderHook` JSX, Harness components, and React type imports are often needed.
- Colocate the test next to the hook: `useMyHook.ts` → `useMyHook.test.tsx`.
- If the hook requires React Router context, pass `{ wrapper: RouterWrapper }` to `renderHook`.

---

## Documentation by Harness — brief summary

A **Harness component** is a small, self-contained React component that mounts the hook and exposes its outputs through DOM elements. **Every hook test file must include at least one**, even when all behavioral assertions are already covered by `renderHook`.

The Harness must be **thoroughly commented** so a reader can understand: what props the hook accepts, which state values are exposed, which handlers are returned, and any non-obvious wiring (e.g. `ref` attachment, conditional rendering).

For complete Harness documentation (template, completeness checklist, void hooks, cleanup, describe block ordering) see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md).
For Harness-specific lint/compiler traps see [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md).

> **When `renderHook` is not possible** — for hooks whose behavior genuinely cannot be exercised without a real DOM, the Harness carries all tests. Document this at the top of the `describe` block with a code comment explaining why.

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

## References

- [unit-testing](../unit-testing/SKILL.md) — core Vitest setup and templates
- [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md) — one-behavior-per-test, named constants, pre-completion checklist
- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — "Documentation by Harness" pattern, DOM-interaction tests, completeness, cleanup
- [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — React Compiler destructure constraint, query helpers, oxlint traps
- [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, `forceCast`, shared fixture constants, filter-query specificity
- [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md) — void hooks, Effect subscriptions, getState spy, cleanup
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — Core `vi.mock`, `vi.spyOn`, Supabase stubs, clearing/resetting
- [unit-testing-mocking-esm](../unit-testing-mocking-esm/SKILL.md) — ESM/Effect, `init()`, Zustand `getState` spy
- [unit-testing-mocking-helpers](../unit-testing-mocking-helpers/SKILL.md) — Callable helpers, `vi.hoisted()`
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — `act`, magic numbers, async races
- [react-conventions](../react-conventions/SKILL.md) — React Compiler rules
- `@testing-library/react` docs: https://testing-library.com/docs/react-testing-library/api/#renderhook
````
