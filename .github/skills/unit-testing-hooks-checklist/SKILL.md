````skill
---
name: unit-testing-hooks-checklist
description: Hook test bundle — run at the end (load alongside unit-testing-hooks + harness + harness-lint). Covers one-behavior-per-test, named constants (no magic numbers), and a comprehensive pre-completion checklist.
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Hook Test Quality & Checklist

For the core hook testing patterns (renderHook, installStore, Harness requirement) see [unit-testing-hooks](../unit-testing-hooks/SKILL.md).

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

This also applies when testing the same handler with different inputs. Each input/output pair is its own behavior:

```tsx
// ❌ Two distinct behaviors in one test — "empty input" and "valid input" are separate behaviors
it("converts empty playlist id to undefined and accepts real ids", async () => {
  result.current.handlePlaylistSelect(""); // behavior 1
  await waitFor(() => expect(result.current.formValues.active_playlist_id).toBeUndefined());

  result.current.handlePlaylistSelect("pl-1"); // behavior 2
  await waitFor(() => expect(result.current.formValues.active_playlist_id).toBe("pl-1"));
});

// ✅ One behavior each
it("sets active_playlist_id to undefined when empty string is selected", async () => {
  result.current.handlePlaylistSelect("");
  await waitFor(() => expect(result.current.formValues.active_playlist_id).toBeUndefined());
});

it("sets active_playlist_id to the provided id when a valid id is selected", async () => {
  result.current.handlePlaylistSelect("pl-1");
  await waitFor(() => expect(result.current.formValues.active_playlist_id).toBe("pl-1"));
});
```

---

## Named constants — strings as well as numbers

Every **magic string** used in more than one place, or whose meaning isn't immediately obvious from context, needs a named constant — not just numeric literals:

```tsx
// ❌ Magic strings scattered across tests
result.current.onKickParticipant("user-9");
expect(mockedRunAction).toHaveBeenCalledWith(
  expect.objectContaining({ actionKey: "kick:user-9" }),
);

// ✅ Named constants make the fixture values explicit and DRY
const USER_ID_9 = "user-9";
result.current.onKickParticipant(USER_ID_9);
expect(mockedRunAction).toHaveBeenCalledWith(
  expect.objectContaining({ actionKey: `kick:${USER_ID_9}` }),
);
```

Declare all fixture constants (event IDs, slugs, user IDs, inputs) at the module top level so every test in the file shares the same values.

---

## Prefer `expect.objectContaining` over `expect.any(Object)`

When asserting a mock was called with a specific shape, use `expect.objectContaining({...})` to verify the fields that actually matter — not `expect.any(Object)`, which passes for any argument:

```tsx
// ❌ Passes even when called with completely wrong payload
expect(mockedRunAction).toHaveBeenCalledWith(expect.any(Object));

// ✅ Asserts the specific actionKey the hook is supposed to send
expect(mockedRunAction).toHaveBeenCalledWith(
  expect.objectContaining({ actionKey: "invite" }),
);
```

Always assert at least `actionKey` (or the analogous identifying field) for action-dispatching hooks.

---

## Lift shared types to module level

If an inline `type` alias appears in more than one test block, extract it to module level. Repeated inline declarations are noise and can diverge:

```tsx
// ❌ Same type declared inside two separate it() blocks
it("invite...", async () => {
  type RunOpts = { action?: () => Promise<unknown> };
  ...
});
it("kick...", async () => {
  type RunOpts = { action?: () => Promise<unknown>; actionKey?: unknown };
  ...
});

// ✅ One declaration at module level, derived from the real function
// Uses `infer First` to avoid a magic-number lint error on [0]
type RunOpts = Parameters<typeof runAction> extends [infer First, ...unknown[]] ? First : never;
```

---

## Dead mocks

Every `vi.fn()` declared inside a test must be asserted. A mock that is configured but never checked provides no value and misleads readers:

```tsx
// ❌ postRun is declared and wired but never asserted against
const postRun = vi.fn();
mockedRunAction.mockImplementation(async (opts) => { await opts.action?.(); postRun(); });
// ... postRun is never mentioned in an expect(...)

// ✅ Either assert it or remove it
expect(postRun).toHaveBeenCalledOnce();
// or — drop postRun entirely and assert on mockedRunAction directly
```

---

## Quick checklist

Before calling a hook test complete, verify:

- [ ] File is `.test.tsx`
- [ ] At least one **Harness component** exists — thoroughly commented to show how the hook integrates with real JSX ("Documentation by Harness")
- [ ] At least one **`renderHook` test** exists — or a code comment in the `describe` block explains why `renderHook` is not possible
- [ ] `renderHook` used for behavioral assertions (state values, handler calls, return values)
- [ ] Harness used for DOM-interaction tests (click-outside, ref attachment, real event propagation)
- [ ] `result.current` read in assertions, not a snapshot alias
- [ ] `installStore(...)` (or equivalent) called explicitly inside each test, not in `beforeEach`
- [ ] Mock data uses the real domain type — `forceCast` used instead of `as unknown as T` (see [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md))
- [ ] Fixture data is a module-level constant; not re-declared inline in each test
- [ ] Each `it` block asserts exactly one behavior — including one input/output pair per test when testing a handler with multiple possible inputs
- [ ] All numeric literals are named constants
- [ ] All fixture **strings** (event IDs, user IDs, slugs, inputs used in >1 place) are named constants
- [ ] Every `vi.fn()` declared in a test is asserted in at least one `expect(...)` call — remove any that aren’t
- [ ] Repeated inline `type` aliases are lifted to module-level declarations
- [ ] Mock call assertions use `toHaveBeenCalledWith(expect.objectContaining({...}))` with specific fields — never `expect.any(Object)`
- [ ] Filter queries narrow the list — not a wildcard that matches everything
- [ ] Harness component destructures hook return; only bindings used in JSX are included (see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md))
- [ ] `waitFor` used for async assertions — `act` never used
- [ ] No `eslint-disable` comments anywhere in the test file
- [ ] No custom `assertDefined` style helpers — use `getByText`/`getByTestId` singular variants
- [ ] `toHaveBeenCalledWith(expect.objectContaining({...}))` used instead of a side-effect accumulator array to capture call arguments
- [ ] Assertions against utility output use the real function's actual return value — never guess; check the source before writing the expectation
- [ ] `vi.mocked(fn)` only used for functions registered with a top-level `vi.mock("path")`; `vi.spyOn(module, "fn")` used for per-test overrides on non-mocked modules
- [ ] Only modules the hook **actually imports** are mocked — verify imports before adding `vi.mock` (see [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md))
- [ ] Subscription hooks: block arrow bodies, `getState` spy, cleanup — see [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md)
- [ ] Lint passes (`npx oxlint --config .oxlintrc.json --type-aware <file>`) before running tests

---

## References

- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, Harness requirement
- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — Harness completeness, cleanup, test structure
- [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — React Compiler constraint, query helpers, oxlint traps
- [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, `forceCast`, shared constants
- [unit-testing-hooks-subscriptions](../unit-testing-hooks-subscriptions/SKILL.md) — void hooks, Effect subscriptions, getState spy, cleanup
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — `act`, magic numbers, async races
````
