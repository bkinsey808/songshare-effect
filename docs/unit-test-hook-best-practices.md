# Unit Testing — React Hooks

Comprehensive guide for testing React hooks with Vitest + Testing Library. Covers `renderHook`,
the "Documentation by Harness" pattern, fixtures, subscriptions, lint traps, and a pre-completion
checklist.

For general Vitest setup (mocking, pitfalls, API testing) see [unit-test-best-practices.md](/docs/unit-test-best-practices.md).

---

## Overview — Dual Requirement

Every hook test file should contain **both**:

1. **`renderHook` tests** — assert hook behavior in isolation. Preferred for all behavioral
   assertions.
2. **At least one Harness component** — shows how the hook is used inside real UI code
   ("Documentation by Harness"). **Always required**, even when `renderHook` covers all behavior.

If a hook test file has neither, that is a red flag: the hook may need to be refactored, or it may
not warrant being a hook at all.

> **When `renderHook` is not possible** — for hooks whose behavior genuinely cannot be exercised
> without a real DOM, the Harness carries all tests. Document this at the top of the `describe`
> block with a comment explaining why.

---

## File Conventions

- Test file: **`.test.tsx`** (not `.test.ts`) for hooks, even if the hook itself is `.ts`. The
  `.tsx` extension is required because `renderHook` JSX, Harness components, and React type imports
  are often needed.
- Colocate the test next to the hook: `useMyHook.ts` → `useMyHook.test.tsx`.
- If the hook requires React Router context, pass `{ wrapper: RouterWrapper }` to `renderHook`.

---

## `renderHook` — the Default Approach

`renderHook` wraps the hook in a minimal React tree and gives you `result.current` to inspect
|return values. It handles re-renders automatically.

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

- Always read state via `result.current` — not a snapshot alias like `const hook = result.current`.
  After state updates `result.current` re-points to the fresh return value; a snapshot alias goes
  stale.
- For async state updates, trigger the action then `await waitFor(...)` on the assertion:

```tsx
result.current.handleInputChange(
	forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }),
);

await waitFor(() => {
	expect(result.current.searchQuery).toBe("alp");
	expect(result.current.isOpen).toBe(true);
});
```

---

## Store Mocking Pattern — `installStore` Helper

Hooks that read from `useAppStore` should use a **per-file `installStore` helper** rather than a
module-level `vi.mocked(...).mockImplementation(...)` call.

```tsx
import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";

vi.mock("@/react/app-store/useAppStore");

function installStore(communities: CommunityEntry[]): void {
	const mockState = { communities };
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}
```

Call `installStore(...)` as the **first line of each test**, not in `beforeEach`. This makes the
store state immediately visible at the test call site and avoids shared setup that obscures what a
failing test depends on.

See [unit-test-best-practices.md — forceCast and installStore](/docs/unit-test-best-practices.md#forceCast-and-the-installStore-selector-dispatch-pattern)
for the full pattern and why `String(selector).includes(...)` string dispatch is avoided.

---

## Documentation by Harness

A **Harness component** is a small React component that mounts the hook and exposes its outputs
through DOM elements. **Every hook test file must include at least one**, regardless of whether
`renderHook` covers all behavior.

**Purpose:** AI agents and future developers need to see how the hook integrates into real UI code.
The Harness shows _how you actually use it_. This is the "Documentation by Harness" pattern.

The Harness must be **thorough and complete** (see completeness checklist below). At minimum:

- Each prop the hook accepts — what it represents
- Each return value wired into JSX — what state it controls or element it attaches to
- Each handler — what event it responds to and what it does
- Any non-obvious wiring (ref attachment, conditional rendering, portals)

For JSDoc in TypeScript/TSX harnesses, use field-level params and skip the wrapper object entry:
use `@param activeCommunityId` / `@param onSelect`, not `@param props`.

```tsx
/**
 * Harness for useMyHook.
 *
 * Shows how useMyHook integrates into a real UI:
 * - A text input that updates the search query
 * - A list of filtered results shown while the dropdown is open
 * - A container div that the click-outside listener is attached to
 */
function Harness(props: {
	activeCommunityId: string | undefined; // pre-selected community (undefined = none)
	onSelect: (id: string) => void; // called when the user picks a result
}): ReactElement {
	// Always destructure — React Compiler rejects hook.property access in JSX
	const {
		containerRef, // ref for the outer div — click-outside closes the dropdown
		inputRef, // ref for the <input> — focus is managed externally
		searchQuery, // controlled value of the search field
		isOpen, // true when the dropdown is visible
		filteredCommunities, // list filtered by the current searchQuery
		handleInputFocus, // sets isOpen = true on focus
		handleInputChange, // updates searchQuery on keystroke
		handleSelectCommunity, // picks a community: calls onSelect, closes dropdown
	} = useMyHook(props);

	return (
		<div ref={containerRef} data-testid="container">
			<input
				ref={inputRef}
				data-testid="search-input"
				value={searchQuery}
				onFocus={handleInputFocus}
				onChange={handleInputChange}
			/>
			{isOpen && (
				<ul data-testid="results">
					{filteredCommunities.map((c) => (
						<li
							key={c.community_id}
							data-testid={`result-${c.community_id}`}
							onClick={() => {
								handleSelectCommunity(c.community_id);
							}}
						>
							{c.community_name}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
```

---

## Harness Completeness

A well-written Harness must be **complete**: expose every input the hook accepts, every return
value it produces, and every observable side effect it has. A reader looking only at the Harness
should understand the full API surface without reading the implementation.

**Every handler must appear in at least one Harness test.** A Harness that wires up handlers but
has only one test checking a single state getter is incomplete.

**Completeness checklist:**

- Every prop / parameter the hook accepts → rendered as editable input or visible label
- Every returned value → rendered in a `data-testid` element so tests can assert it
- Every returned handler → wired to a button or interactive element with a `data-testid`
- Every cleanup / unsubscribe pathway → exposed via an "unsubscribe" or "stop" button
- Every conditional state (loading, error, empty, populated) → rendered when truthy
- For **void hooks**: read the relevant store slices directly in the Harness and expose them
  through `data-testid` elements

**Void hook Harness example:**

```tsx
function Harness({ eventSlug }: { eventSlug?: string }): ReactElement {
	useActiveEventSync({ eventSlug });

	const currentEventId = useAppStore((s) => s.currentEvent?.event_id);
	const fetchEventBySlug = useAppStore((s) => s.fetchEventBySlug);

	return (
		<div>
			{/* currentEventId: event this hook is synced to */}
			<div data-testid="current-event-id">{String(currentEventId ?? "")}</div>

			{/* fetch button: documents the fetch lifecycle */}
			<button
				type="button"
				data-testid="call-fetch"
				onClick={() => {
					void (fetchEventBySlug as Function)("doc-slug");
				}}
			>
				fetch
			</button>
		</div>
	);
}
```

---

## DOM Cleanup Between Harness Tests

This project's Vitest config does **not** set `globals: true`, so Testing Library cannot
auto-register its `afterEach(cleanup)` hook. The project linter also disallows
`afterEach`/`beforeEach` lifecycle hooks.

**Rule: every harness test that calls `render(...)` must begin with `cleanup()`.**

```tsx
describe("harness (DOM) behavior", () => {
  it("shows initial state", async () => {
    // cleanup() is required: this project cannot auto-register afterEach(cleanup)
    // (no globals:true, and afterEach is disallowed by the linter). Each harness
    // test starts clean by calling cleanup() itself.
    cleanup();
    installStore({ ... });
    render(<Harness />);
    // ...
  });

  it("responds to a click", async () => {
    cleanup(); // same reason as above
    installStore({ ... });
    const rendered = render(<Harness />);
    // ...
  });
});
```

`renderHook` tests are not affected — `renderHook` manages its own instance.

---

## Test File Structure — Separate Describe Blocks

Every hook test file that contains both Harness tests and `renderHook` tests **must split them into
two separate top-level `describe` blocks**. Use the naming `"useMyHook — Harness"` and
`"useMyHook — renderHook"`, with the Harness block appearing **first**:

```tsx
describe("useMyHook — Harness", () => {
	// DOM-interaction and documentation-driven tests using the Harness
});

describe("useMyHook — renderHook", () => {
	// Behavioral assertions using renderHook
});
```

**Why separate blocks:** Keeps renderHook tests and Harness (DOM) tests clearly separated.
**Why Harness first:** the Harness is documentation — it shows the "shape" of usage before the
reader encounters lower-level behavioral assertions.

---

## DOM Query Scoping

Always scope DOM queries to the specific render container. Bare `getByTestId("foo")` queries
`document.body` and throws "Found multiple elements" when multiple renders exist.

```tsx
// ❌ Queries entire body
const { getByTestId } = render(<Harness />);
fireEvent.click(getByTestId("submit-btn"));

// ✅ Scoped to this render
const rendered = render(<Harness />);
fireEvent.click(within(rendered.container).getByTestId("submit-btn"));
```

Import `within` from `@testing-library/react`. Use this pattern in **every Harness test**.

---

## When the Harness is Needed for Behavioral Tests

The Harness is the **only** way to test certain behaviors that require a real DOM:

| Scenario                                              | Use          |
| ----------------------------------------------------- | ------------ |
| Hook documentation (always)                           | Harness      |
| Reading state / calling handlers that update state    | `renderHook` |
| `useEffect` that reads `ref.current.contains(target)` | Harness      |
| Ref attached to the correct DOM node                  | Harness      |
| Events with propagation behavior                      | Harness      |

---

## Harness Lint & Compiler Traps

> ⚠️ **Read this section before writing any Harness JSX.**

### React Compiler constraint — always destructure

The React Compiler (`babel-plugin-react-compiler`) **rejects property access on a hook return
object during render when that object also contains refs**. Even accessing non-ref properties via
`hook.isOpen` triggers `ReactCompilerError: Cannot access refs during render`.

**Always destructure at the hook call site:**

```tsx
// ❌ Triggers ReactCompilerError even though isOpen is not a ref
const hook = useMyHook({ ... });
return <span>{String(hook.isOpen)}</span>;

// ✅ Compiler traces each binding individually
const { containerRef, isOpen, handleInputFocus } = useMyHook({ ... });
return <span>{String(isOpen)}</span>;
```

**Only destructure what you actually use in JSX.** Do not add an unused `_alias` binding.

This constraint does **not** apply to `renderHook` tests — `result.current` is accessed in the
test body, not inside JSX.

### Query helpers — use singular variants, never `assertDefined`

`getByText` / `getByTestId` / `getByRole` already throw a descriptive error when no match is found.
Never write a custom `assertDefined` helper to validate `getAllBy*(...)[0]`.

```tsx
// ❌ Fragile — assertDefined is a conditional assertion anti-pattern
const [openBtn] = screen.getAllByText("open");
assertDefined(openBtn, "open button not found");
fireEvent.click(openBtn);

// ✅ getByText throws with a clear message if not found
fireEvent.click(screen.getByText("open"));
```

### Event-handler parameter naming — `min-identifier-length`

The linter requires identifiers to be at least 2 characters. Use `ev` or `event` instead of `e`:

```tsx
// ❌ lint error: Identifier name too short
<input onChange={(e) => { handleNameChange(e.target.value); }} />

// ✅
<input onChange={(ev) => { handleNameChange(ev.target.value); }} />
```

### Promise-returning `onSubmit` — `no-misused-promises`

If the hook returns an `async` submit handler, passing it directly to `<form onSubmit={...}>`
triggers `no-misused-promises`. Wrap it:

```tsx
// ❌ lint error: Promise-returning function where void return expected
<form onSubmit={handleFormSubmit}>

// ✅
<form onSubmit={(ev) => { void handleFormSubmit(ev); }}>
```

### `String()` on non-primitive objects — `no-base-to-string`

`getFieldError()` may return an object. `String(obj)` silently produces `[object Object]`:

```tsx
// ❌ lint error
<span>{String(getFieldError("event_name"))}</span>

// ✅ Serialize properly
<span>{JSON.stringify(getFieldError("event_name"))}</span>
```

### Harness return type — use the ambient `ReactElement`

This project declares `ReactElement` as a global ambient type. **Never import it from `'react'`**:

```tsx
// ❌ lint error: no-reactelement-import
import type { ReactElement } from "react";

// ✅ Use the ambient type — no import needed
function Harness(): ReactElement { ... }
```

---

## Fixtures

### Use the real domain type

Declare fixture arrays with the actual domain type (e.g. `CommunityEntry[]`), not trimmed subsets
or `Record<string, unknown>`. This ensures the fixture stays in sync with schema changes.

```tsx
// ❌ Loses type safety
const mockCommunities: Record<string, unknown>[] = [ ... ];

// ✅ Typed correctly
const mockCommunities: CommunityEntry[] = [ ... ];
```

### `forceCast` for nullable fields

Fields typed as `string | null` cannot be assigned `undefined` directly (type mismatch), and
`null` is rejected by the `no-null-literals` lint rule. Use `forceCast<T>(value)` from
`@/react/lib/test-utils/forceCast`:

```tsx
import forceCast from "@/react/lib/test-utils/forceCast";

const mockCommunities: CommunityEntry[] = [
	{
		community_id: "c1",
		owner_id: "owner1",
		name: "Alpha",
		slug: "alpha",
		description: forceCast<string | null>(undefined),
		is_public: true,
		public_notes: forceCast<string | null>(undefined),
		created_at: "2020-01-01",
		updated_at: "2020-01-02",
	},
];
```

```tsx
// ❌ Triggers no-unsafe-type-assertion
result.current.handleInputChange({
	target: { value: "alp" },
} as unknown as ChangeEvent<HTMLInputElement>);

// ✅
result.current.handleInputChange(
	forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }),
);
```

### Shared fixture constants — declare at module level

Do **not** re-declare the same fixture object inside every test. Declare module-level constants and
reference them everywhere. If a single test needs a different store shape, pass a local override
directly to `installStore` for that one test only.

```tsx
// ✅ Module-level constant
const MOCK_ENTRIES: Record<string, unknown> = {
	e1: { event_id: "e1", event_public: { event_name: "First Event", event_slug: "first" } },
	e2: { event_id: "e2", event_public: { event_name: "Second Event", event_slug: "second" } },
};
```

### Filter-query specificity

Use a query string that **narrows the result to fewer entries** than the full list. A query that
matches every entry proves nothing.

```tsx
// ❌ "a" matches Alpha, Beta, Gamma — filtering is never verified
result.current.handleInputChange(
	forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "a" } }),
);

// ✅ "alp" matches only Alpha — narrowing is confirmed
result.current.handleInputChange(
	forceCast<ChangeEvent<HTMLInputElement>>({ target: { value: "alp" } }),
);
await waitFor(() => {
	expect(result.current.filteredCommunities).toHaveLength(ONE_RESULT);
});
```

---

## Effect-based Subscription Hooks

Focused guidance for testing hooks that subscribe to realtime data via
`Effect.runPromise(subscribeFn(...))`.

### `void`-returning hooks — block arrow bodies in `renderHook`

The linter bans shorthand arrow returns of `void` expressions (`arrow-body-style`):

```tsx
// ❌ Lint error: returning a void expression from arrow shorthand is forbidden
renderHook(() => useMySubscriptionHook("id-1"));

// ✅ Block body
renderHook(() => {
	useMySubscriptionHook("id-1");
});
```

### The subscription hook test pattern

Hooks that call `Effect.runPromise(subscribeFn(id, useAppStore.getState))` follow five rules:

1. **Mock the subscribe module** with `vi.mock("path/to/subscribeFn")` (factoryless).
2. **Set a module-level default** returning `Effect.succeed(() => undefined)` so tests that don't
   care about cleanup work without extra setup.
3. **Spy on `useAppStore.getState`** with
   `vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}))` — the auto-mock does **not**
   stub static properties.
4. **For cleanup tests**: override the default with `Effect.succeed(cleanupFn)`, then `unmount()`
   and assert `cleanupFn` was called.
5. **One behavior per test**: separate "subscribed with the right args" from "cleanup was called".

### Full example

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
			// Exact reference — not expect.any(Function) — catches regressions
			expect(vi.mocked(subscribeToCommunityEvent)).toHaveBeenCalledWith(
				COMMUNITY_ID,
				useAppStore.getState,
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

		const { rerender } = renderHook(
			({ id }) => {
				useMySubscriptionHook(id);
			},
			{ initialProps: { id: undefined as string | undefined } },
		);

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

See `react/src/community/manage/community-manage-view/useCommunityManageSubscriptions.test.tsx`
for a production example with two parallel subscriptions.

---

## Test Quality Rules

### One behavior per test

Each `it` block should assert a single outcome. Split combined tests:

```tsx
// ❌ Two behaviors in one test
it("select and clear work", async () => { ... });

// ✅ One behavior each
it("handleSelectCommunity calls onSelect with the community id and resets state", async () => { ... });
it("handleClearSelection calls onSelect with empty string and resets state", async () => { ... });
```

This also applies when testing the same handler with different inputs — each input/output pair is
its own behavior.

### Named constants — strings as well as numbers

Every magic string used in more than one place, or whose meaning isn't obvious, needs a named
constant:

```tsx
// ❌ Magic strings
result.current.onKickParticipant("user-9");
expect(mockedRunAction).toHaveBeenCalledWith(expect.objectContaining({ actionKey: "kick:user-9" }));

// ✅ Named constants
const USER_ID_9 = "user-9";
result.current.onKickParticipant(USER_ID_9);
expect(mockedRunAction).toHaveBeenCalledWith(
	expect.objectContaining({ actionKey: `kick:${USER_ID_9}` }),
);
```

Declare all fixture constants at module top level so every test in the file shares them.

### Prefer `expect.objectContaining` over `expect.any(Object)`

```tsx
// ❌ Passes for any argument
expect(mockedRunAction).toHaveBeenCalledWith(expect.any(Object));

// ✅ Asserts the specific actionKey
expect(mockedRunAction).toHaveBeenCalledWith(expect.objectContaining({ actionKey: "invite" }));
```

### Lift shared types to module level

If an inline `type` alias appears in more than one `it` block, extract it to module level:

```tsx
// ✅ Module-level, derived from the real function
type RunOpts = Parameters<typeof runAction> extends [infer First, ...unknown[]] ? First : never;
```

### Dead mocks

Every `vi.fn()` declared inside a test must be asserted. Remove any that are configured but never
checked.

---

## Pre-completion Checklist

Before calling a hook test complete, verify:

- [ ] File is `.test.tsx`
- [ ] Harness and renderHook tests in **separate describe blocks**: `"useMyHook — Harness"` first,
      then `"useMyHook — renderHook"`
- [ ] At least one **Harness component** exists — thoroughly commented
- [ ] At least one **`renderHook` test** exists — or a code comment explains why it's not possible
- [ ] `renderHook` used for behavioral assertions; Harness used for DOM-interaction tests
- [ ] `result.current` read in assertions, not a snapshot alias
- [ ] `installStore(...)` called explicitly inside each test, not in `beforeEach`
- [ ] Mock data uses the real domain type — `forceCast` used instead of `as unknown as T`
- [ ] Fixture data is a module-level constant; not re-declared inline in each test
- [ ] Each `it` block asserts exactly one behavior
- [ ] All numeric literals are named constants
- [ ] All fixture strings (IDs, slugs, inputs used in >1 place) are named constants
- [ ] Every `vi.fn()` declared in a test is asserted — remove unchecked ones
- [ ] Repeated inline `type` aliases lifted to module-level
- [ ] Mock call assertions use `toHaveBeenCalledWith(expect.objectContaining({...}))` never
      `expect.any(Object)`
- [ ] Filter queries narrow the list — not a wildcard that matches everything
- [ ] Harness destructures hook return; only bindings used in JSX are included
- [ ] `act` / `waitFor` usage follows the general guidance in [unit-test-best-practices.md](/docs/unit-test-best-practices.md#act-vs-waitfor)
- [ ] No `eslint-disable` comments in the test file
- [ ] No custom `assertDefined` helpers — use singular `getBy*` variants
- [ ] `toHaveBeenCalledWith(expect.objectContaining({...}))` used instead of a side-effect
      accumulator array
- [ ] Assertions against utility output use the real function's actual return value — check source
      before writing the expectation
- [ ] `vi.mocked(fn)` only used for functions registered with a top-level `vi.mock("path")`
- [ ] Only modules the hook **actually imports** are mocked — verify imports first
- [ ] Subscription hooks: block arrow bodies, `getState` spy, cleanup verified
- [ ] Harness tests begin with `cleanup()` before `render(...)`
- [ ] DOM queries scoped with `within(rendered.container)` — no bare `getByTestId`
- [ ] Lint passes (`npx oxlint --config .oxlintrc.json --type-aware <file>`) before running tests

---

## References

- [unit-test-best-practices.md](/docs/unit-test-best-practices.md) — Core Vitest setup, mocking, pitfalls, API testing
- [react-conventions.md](/docs/component-patterns.md) — React Compiler rules
- Agent guidance: `.github/agents/Unit Test Agent.agent.md`
- `@testing-library/react` docs: https://testing-library.com/docs/react-testing-library/api/#renderhook
- Vitest documentation: https://vitest.dev/
