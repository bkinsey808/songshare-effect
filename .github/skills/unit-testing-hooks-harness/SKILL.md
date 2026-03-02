````skill
---
name: unit-testing-hooks-harness
description: When and how to write a Harness component for hook tests. Covers when renderHook is sufficient (and a Harness is overkill), the full Harness template, React Compiler destructure constraint, and query-helper rules (no assertDefined, use singular getBy* variants). Use whenever a hook test requires real DOM interaction.
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Hook Harness Components

For the general renderHook-first approach see [unit-testing-hooks](../unit-testing-hooks/SKILL.md).

---

## When to use a Harness

A Harness component (a small wrapper that renders the hook in a real React tree) is required **only** when `renderHook` alone cannot simulate the interaction. The canonical case is testing **`useEffect` logic that touches the real DOM**, such as a click-outside handler that relies on `containerRef.current.contains(event.target)`.

**Do not reach for a Harness when `renderHook` is sufficient.** A common mistake is writing `render(<Harness ...>)` + `fireEvent.click` to exercise something like `handleInputFocus`. That function does not need a real DOM — call it directly via `result.current` and assert with `waitFor`:

```tsx
// ❌ Harness used unnecessarily — handleInputFocus just calls setIsOpen(true)
render(<Harness onSelect={vi.fn()} />);
fireEvent.click(screen.getAllByText("open")[0]);
await waitFor(() => {
  expect(screen.getAllByTestId("is-open")[0].textContent).toBe("true");
});

// ✅ renderHook is sufficient — no DOM needed for a plain state setter
const { result } = renderHook(() =>
  useMyHook({ activeId: undefined, onSelect: vi.fn() }),
);
result.current.handleInputFocus();
await waitFor(() => {
  expect(result.current.isOpen).toBe(true);
});
```

**Summary of when each approach applies:**

| Scenario | Use |
|---|---|
| Reading state / calling handlers that set state | `renderHook` |
| Firing synthetic events at DOM elements | `renderHook` + `fireEvent` on a detached node (rare) or `Harness` |
| `useEffect` that reads `ref.current.contains(target)` | `Harness` required |
| Testing that a ref is attached to the correct DOM node | `Harness` required |

---

## Harness template

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";

function Harness(props: { onSelect: (id: string) => void }): ReactElement {
  // Destructure from the hook call — do NOT store the whole return object
  // and then access properties from it in JSX (see React Compiler constraint below).
  // Only destructure bindings the Harness actually uses in its JSX.
  const { containerRef, isOpen, handleInputFocus } = useMyHook({
    activeId: undefined,
    onSelect: props.onSelect,
  });
  return (
    <div>
      <div ref={containerRef} data-testid="container">
        <span data-testid="is-open">{String(isOpen)}</span>
        <button type="button" onClick={handleInputFocus}>open</button>
      </div>
      <button type="button" data-testid="outside">outside</button>
    </div>
  );
}

it("closes the dropdown when a mousedown fires outside the container", async () => {
  installStore(mockEntries);
  render(<Harness onSelect={vi.fn()} />);

  fireEvent.click(screen.getByText("open"));
  await waitFor(() => {
    expect(screen.getByTestId("is-open").textContent).toBe("true");
  });

  fireEvent.mouseDown(screen.getByTestId("outside"));
  await waitFor(() => {
    expect(screen.getByTestId("is-open").textContent).toBe("false");
  });
});
```

---

## React Compiler constraint — always destructure

The React Compiler (`babel-plugin-react-compiler`) **rejects any property access on a hook return object during render when that object also contains refs** (`containerRef`, `inputRef`, etc.). Even accessing non-ref properties like `isOpen` or `handleInputFocus` via `hook.isOpen` triggers:

> `ReactCompilerError: Cannot access refs during render`

**Always destructure at the hook call site:**

```tsx
// ❌ Triggers ReactCompilerError even though isOpen is not a ref
const hook = useMyHook({ ... });
return <span>{String(hook.isOpen)}</span>;

// ✅ Compiler traces each binding individually
const { containerRef, isOpen, handleInputFocus } = useMyHook({ ... });
return <span>{String(isOpen)}</span>;
```

**Only destructure what you actually use in JSX.** Do not add an unused `_alias` binding just to silence a TypeScript warning:

```tsx
// ❌ Unused binding adds noise and triggers lint
const { containerRef, inputRef: _inputRef, isOpen } = useMyHook({ ... });

// ✅ Simply omit it
const { containerRef, isOpen } = useMyHook({ ... });
```

This constraint does **not** apply to `renderHook` tests — `result.current` is accessed in the test body, not inside JSX.

---

## Query helpers — use singular variants, never `assertDefined`

Never write a custom `assertDefined` (or similar guard) helper to validate the result of `getAllBy*(...)[0]`. The singular `getByText` / `getByTestId` / `getByRole` family already throws a descriptive error when no match is found — no helper is needed.

```tsx
// ❌ Fragile: assertDefined is a conditional assertion (anti-pattern);
//    getAllByText also picks up unintended duplicates
const [openBtn] = screen.getAllByText("open");
assertDefined(openBtn, "open button not found");
fireEvent.click(openBtn);

// ✅ getByText throws with a clear message if not found; no guard needed
fireEvent.click(screen.getByText("open"));
```

---

## References

- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, test structure
- [unit-testing-hooks-fixtures](../unit-testing-hooks-fixtures/SKILL.md) — mock data, forceCast, shared constants
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — act, magic numbers, async races
- [react-conventions](../react-conventions/SKILL.md) — React Compiler rules
````
