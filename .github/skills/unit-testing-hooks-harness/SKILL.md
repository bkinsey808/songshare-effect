````skill
---
name: unit-testing-hooks-harness
description: Hook test bundle — Harness component (load alongside unit-testing-hooks + harness-lint + checklist). Covers the "Documentation by Harness" requirement (always include one, thoroughly commented), when the Harness is also needed for DOM interactions, the full Harness template, cleanup, completeness checklist, and test structure. For lint/compiler traps see unit-testing-hooks-harness-lint.
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+
metadata:
  author: bkinsey808
  version: "1.3"
---

# Unit Testing — Hook Harness Components

For the general hook testing structure (renderHook + Harness requirement) see [unit-testing-hooks](../unit-testing-hooks/SKILL.md).

> ⚠️ **Always also load [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) before writing Harness JSX.** Three oxlint rules consistently fail in Harness components: `min-identifier-length` (use `ev` not `e`), `no-misused-promises` (wrap async `onSubmit`), and `no-base-to-string` (use `JSON.stringify` not `String()` for objects). These only appear at lint time — the logic looks correct before then.

---

## Why every hook test file needs a Harness — "Documentation by Harness"

A Harness component is a small React component that mounts the hook and wires its return values into real JSX. **Every hook test file must contain at least one Harness**, regardless of whether `renderHook` already covers all behavioral assertions.

**Purpose:** AI agents and future developers reading the test file need to see how the hook integrates into real UI code. `renderHook` tests describe *what* the hook does; the Harness shows *how* you actually use it. This is the "Documentation by Harness" pattern.

The Harness must be **thorough and complete** — see the "Harness completeness" section below for a full checklist. At minimum:
- Each prop the hook accepts — what it represents
- Each return value that is wired into JSX — what state it controls or what element it attaches to
- Each handler — what event it responds to and what it does
- Any non-obvious wiring (ref attachment, conditional rendering, portals)

For how to structure the test file around the Harness, see the "Test file structure — describe block ordering" section below.

For JSDoc in TypeScript/TSX harnesses, use field-level params and skip the wrapper object entry: use `@param activeCommunityId` / `@param onSelect`, not `@param props`.

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
  onSelect: (id: string) => void;        // called when the user picks a result
}): ReactElement {
  // Always destructure — React Compiler rejects hook.property access in JSX
  const {
    containerRef,          // ref for the outer div — click-outside closes the dropdown
    inputRef,              // ref for the <input> — focus is managed externally
    searchQuery,           // controlled value of the search field
    isOpen,                // true when the dropdown is visible
    filteredCommunities,   // list filtered by the current searchQuery
    handleInputFocus,      // sets isOpen = true on focus
    handleInputChange,     // updates searchQuery on keystroke
    handleSelectCommunity, // picks a community: calls onSelect, closes dropdown
  } = useMyHook(props);

  return (
    <div ref={containerRef} data-testid="container">
      {/* input: onFocus shows dropdown, onChange filters it */}
      <input
        ref={inputRef}
        data-testid="search-input"
        value={searchQuery}
        onFocus={handleInputFocus}
        onChange={handleInputChange}
      />
      {/* results: only rendered while isOpen is true */}
      {isOpen && (
        <ul data-testid="results">
          {filteredCommunities.map((c) => (
            <li
              key={c.community_id}
              data-testid={`result-${c.community_id}`}
              onClick={() => { handleSelectCommunity(c.community_id); }}
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

## DOM cleanup between harness tests

This project's Vitest config does **not** set `globals: true`, which means Testing Library cannot auto-register its `afterEach(cleanup)` hook. The project linter also disallows `afterEach`/`beforeEach` lifecycle hooks.

**Rule: every harness test that calls `render(...)` must begin with `cleanup()`.**

This keeps each test isolated — it erases the previous test's DOM before rendering a fresh tree. A `cleanup()` at the start of the first test in a describe block is a safe no-op and is included for consistency.

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
    const { getByTestId } = render(<Harness />);
    // ...
  });
});
```

`renderHook` tests are not affected — `renderHook` manages its own instance and does not render to `document.body`.

---

## Test file structure — describe block ordering

Every hook test file that contains both Harness tests and `renderHook` tests **must split them into two separate named `describe` blocks**, with the Harness block appearing **first**:

```tsx
describe("useMyHook", () => {
  describe("harness (DOM) behavior", () => {
    // DOM-interaction and documentation-driven tests using the Harness
  });

  describe("renderHook behavior", () => {
    // Behavioral assertions using renderHook
  });
});
```

**Why Harness first:** the Harness is documentation — it shows the "shape" of usage before the reader encounters the lower-level behavioral assertions. Placing it first reinforces the Documentation by Harness philosophy: new readers see the usage example before diving into the fine-grained behavioural checks.

Never collapse both groups into a single flat `describe` block; the split makes the documentation intent explicit and keeps skimmable structure.

---

## Harness completeness — expose everything the hook can do

A well-written Harness must be **complete**: it should expose every input the hook accepts, every return value the hook produces, and every observable side effect the hook has. A reader looking only at the Harness should be able to understand the full API surface of the hook without reading its implementation.

**Checklist for completeness:**

- Every prop / parameter the hook accepts → rendered as editable input or visible label
- Every returned value → rendered in a `data-testid` element so tests can assert it
- Every returned handler → wired to a button or interactive element with a `data-testid`
- Every cleanup / unsubscribe pathway → exposed via an "unsubscribe" or "stop" button
- Every conditional state (loading, error, empty, populated) → rendered when truthy so tests can wait for it
- For **void hooks** (hooks that return nothing): read the relevant store slices directly in the Harness and expose them through `data-testid` elements, so the Harness still serves as documentation of what the hook drives

**Every handler must appear in at least one Harness test.** A Harness component that wires up handlers but has only one test checking a single state getter is incomplete — it documents the API surface but not the interaction flow. Each distinct handler path (invite, kick, clear, select, etc.) must have a corresponding Harness test that fires the event and asserts the observable outcome (DOM change and/or mock call).

---

## DOM query scoping — always use `within(rendered.container)`

Testing Library renders components into `document.body`. When multiple `render(...)` calls exist in the same test file (even across different tests, if `cleanup()` was somehow missed), bare `getByTestId("foo")` will throw "Found multiple elements". **Always scope DOM queries to the specific render container:**

```tsx
// ❌ Queries the entire document.body — fails when multiple renders exist
const { getByTestId } = render(<Harness />);
fireEvent.click(getByTestId("submit-btn"));

// ✅ Scoped to this render's container — safe regardless of other renders
const rendered = render(<Harness />);
fireEvent.click(within(rendered.container).getByTestId("submit-btn"));
```

This pattern is required for **every Harness test** — even the only test in a describe block, because future tests or test-file imports may add additional renders.

```tsx
// ✅ Void hook: the Harness reads the store slices the hook affects
function Harness({ eventSlug }: { eventSlug?: string }): ReactElement {
  useActiveEventSync({ eventSlug });

  // Read the slices this hook drives, so tests can observe side effects
  const currentEventId = useAppStore((s) => s.currentEvent?.event_id);
  const fetchEventBySlug = useAppStore((s) => s.fetchEventBySlug);
  const subscribeToEvent = useAppStore((s) => s.subscribeToEvent);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const unsubRef = useRef<(() => void) | undefined>(undefined);

  return (
    <div>
      {/* currentEventId: the event id the hook is currently synced to */}
      <div data-testid="current-event-id">{String(currentEventId ?? "")}</div>

      {/* fetch button: triggers fetchEventBySlug directly for documentation */}
      <button type="button" data-testid="call-fetch"
        onClick={() => { void (fetchEventBySlug as Function)("doc-slug"); }}>
        fetch
      </button>

      {/* subscribe/unsubscribe: documents the subscribe lifecycle */}
      <button type="button" data-testid="subscribe"
        onClick={() => {
          const unsub = subscribeToEvent?.();
          unsubRef.current = unsub;
          setIsSubscribed(Boolean(unsub));
        }}>subscribe</button>
      <button type="button" data-testid="unsubscribe"
        onClick={() => {
          unsubRef.current?.();
          unsubRef.current = undefined;
          setIsSubscribed(false);
        }}>unsubscribe</button>

      {/* is-subscribed: observable subscription state */}
      <div data-testid="is-subscribed">{String(isSubscribed)}</div>
    </div>
  );
}
```

---

## When the Harness is also needed for behavioral tests

In addition to documentation, the Harness is the **only** way to test certain behaviors that require a real DOM tree:

- **Click-outside detection** — `useEffect` logic that calls `containerRef.current.contains(event.target)`
- **Focus/blur propagation** — `onBlur` events that don't fire reliably on detached nodes
- **Ref attachment verification** — checking that a ref ends up on the correct DOM element

For everything else (state changes, handler calls, return-value transformations), **prefer `renderHook`**: it's faster, simpler, and doesn't require setting up DOM queries.

| Scenario | Use |
|---|---|
| Hook documentation (always) | Harness |
| Reading state / calling handlers that update state | `renderHook` |
| `useEffect` that reads `ref.current.contains(target)` | Harness |
| Testing that a ref is attached to the correct DOM node | Harness |
| Firing events at DOM elements to trigger state changes | `renderHook` for simple cases; Harness if propagation matters |

---

## When `renderHook` is not possible

If all behavior genuinely requires a real DOM and `renderHook` cannot exercise the hook at all, document this at the top of the `describe` block:

```tsx
describe("useMyHook", () => {
  // renderHook is not used here because this hook's entire behavior depends
  // on a MutationObserver attached to containerRef — the observer does not
  // fire on detached nodes, so all tests use the Harness instead.
  ...
});
```
```

---

## References

- [unit-testing-hooks-harness-lint](../unit-testing-hooks-harness-lint/SKILL.md) — React Compiler destructure constraint, query helpers, oxlint traps
- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, test structure
- [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, forceCast, shared constants
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — act, magic numbers, async races
- [react-conventions](../react-conventions/SKILL.md) — React Compiler rules
````
