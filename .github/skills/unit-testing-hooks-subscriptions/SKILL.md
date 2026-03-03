````skill
---
name: unit-testing-hooks-subscriptions
description: Patterns for testing React hooks that manage Effect-based realtime subscriptions (Effect.runPromise + subscribeFn). Covers void-hook arrow bodies, module-level defaults, getState spy, cleanup verification, and the undefined→defined transition test. Use when testing any hook that calls Effect.runPromise(subscribeFn(...)).
license: MIT
compatibility: Vitest 1.x, effect 3.x, @testing-library/react 14+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Effect-based Subscription Hooks

Focused guidance for testing hooks that subscribe to realtime data via `Effect.runPromise(subscribeFn(...))`.

For general hook testing see [unit-testing-hooks](../unit-testing-hooks/SKILL.md).
For mocking strategies (clearing vs. resetting, `getState` spy) see [unit-testing-mocking](../unit-testing-mocking/SKILL.md).

---

## `void`-returning hooks — use block arrow bodies in `renderHook`

The linter bans shorthand arrow returns of `void` expressions (`arrow-body-style`). When a hook returns `void`, use a block body inside `renderHook`:

```tsx
// ❌ Lint error: returning a void expression from arrow shorthand is forbidden
renderHook(() => useMySubscriptionHook("id-1"));

// ✅ Block body — the return value is intentionally discarded
renderHook(() => {
  useMySubscriptionHook("id-1");
});
```

---

## The subscription hook test pattern

Hooks that call `Effect.runPromise(subscribeFn(id, useAppStore.getState))` follow these five rules:

1. **Mock the subscribe module** with `vi.mock("path/to/subscribeFn")` (factoryless — no typed factory).
2. **Set a module-level default** returning `Effect.succeed(() => undefined)` so tests that don't care about cleanup work without extra setup.
3. **Spy on `useAppStore.getState`** with `vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}))` — the auto-mock does **not** stub static properties.
4. **For cleanup tests**: override the default with `Effect.succeed(cleanupFn)`, then `unmount()` and assert `cleanupFn` was called.
5. **One behavior per test**: separate "subscribed with the right args" from "cleanup was called".

---

## Full example

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import subscribeToCommunityEvent from "@/react/community/subscribe/subscribeToCommunityEvent";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/community/subscribe/subscribeToCommunityEvent");

// Module-level default — override per-test when a specific cleanup fn is needed
vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));

const COMMUNITY_ID = "c1";

describe("useMySubscriptionHook", () => {
  it("skips subscription when communityId is undefined", () => {
    vi.clearAllMocks(); // clears call counts; preserves mockReturnValue defaults

    renderHook(() => {
      useMySubscriptionHook(undefined);
    });

    expect(vi.mocked(subscribeToCommunityEvent)).not.toHaveBeenCalled();
  });

  it("subscribes with communityId and getState", async () => {
    vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

    renderHook(() => {
      useMySubscriptionHook(COMMUNITY_ID);
    });

    await waitFor(() => {
      expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
        COMMUNITY_ID,
        useAppStore.getState, // exact reference — not expect.any(Function)
      );
    });
  });

  it("calls cleanup on unmount", async () => {
    const cleanup = vi.fn();
    vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(cleanup));
    vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

    const { unmount } = renderHook(() => {
      useMySubscriptionHook(COMMUNITY_ID);
    });

    await waitFor(() => {
      expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
        COMMUNITY_ID,
        useAppStore.getState,
      );
    });

    unmount();
    expect(cleanup).toHaveBeenCalledWith();
  });

  it("begins subscribing when communityId transitions from undefined to defined", async () => {
    vi.clearAllMocks();
    vi.mocked(subscribeToCommunityEvent).mockReturnValue(Effect.succeed(() => undefined));
    vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));

    const { rerender } = renderHook(({ id }) => {
      useMySubscriptionHook(id);
    }, { initialProps: { id: undefined as string | undefined } });

    expect(vi.mocked(subscribeToCommunityEvent)).not.toHaveBeenCalled();

    rerender({ id: COMMUNITY_ID });

    await waitFor(() => {
      expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
        COMMUNITY_ID,
        useAppStore.getState,
      );
    });
  });
});
```

---

## Why `useAppStore.getState` and not `expect.any(Function)`

The hook passes the exact `useAppStore.getState` reference to the subscribe function. Asserting the exact reference catches regressions where the hook accidentally passes a different function — `expect.any(Function)` would miss that.

---

## Real-world example

See [useCommunityManageSubscriptions.test.tsx](../../../react/src/community/manage/community-manage-view/useCommunityManageSubscriptions.test.tsx) for a production example with two parallel subscriptions, each tested independently.

---

## References

- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — core renderHook patterns, installStore, Harness requirement
- [unit-testing-hooks-checklist](../unit-testing-hooks-checklist/SKILL.md) — one-behavior-per-test, named constants, pre-completion checklist
- [unit-testing-mocking](../unit-testing-mocking/SKILL.md) — clearAllMocks vs. resetAllMocks, getState spy, factoryless vi.mock
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — act, async races, magic numbers
````
