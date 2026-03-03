````skill
---
name: unit-testing-hooks-harness-lint
description: Hook test bundle ⚠️ load before writing Harness JSX (load alongside unit-testing-hooks + harness + checklist). Covers the React Compiler destructure constraint, query-helper rules (singular variants, no assertDefined), and oxlint traps (min-identifier-length, no-misused-promises, no-base-to-string).
license: MIT
compatibility: Vitest 1.x, @testing-library/react 14+, React 18+, React Compiler
metadata:
  author: bkinsey808
  version: "1.0"
---

# Unit Testing — Harness Lint & Compiler Traps

For the core Harness pattern (why, completeness checklist, test structure) see [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md).

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

## Harness-specific lint traps

Lower-end models consistently hit these oxlint rules when writing Harness components. Watch for them:

### Event-handler parameter naming — `min-identifier-length`

The linter requires identifiers to be at least 2 characters. Use `ev` or `event` instead of `e` in `onChange` handlers:

```tsx
// ❌ lint error: Identifier name is too short (< 2)
<input onChange={(e) => { handleNameChange(e.target.value); }} />

// ✅ Use `ev` (or `event` — but avoid shadowing React.FormEvent on `<form>`)
<input onChange={(ev) => { handleNameChange(ev.target.value); }} />
```

### Promise-returning `onSubmit` — `no-misused-promises`

If the hook returns an `async` submit handler (e.g. `handleFormSubmit`), passing it directly to `<form onSubmit={handleFormSubmit}>` triggers `no-misused-promises` because `onSubmit` expects `void`, not `Promise<void>`. Wrap it:

```tsx
// ❌ lint error: Promise-returning function provided where void return expected
<form onSubmit={handleFormSubmit}>

// ✅ Wrap and void the promise
<form onSubmit={(ev) => { void handleFormSubmit(ev); }}>
```

### `String()` on non-primitive objects — `no-base-to-string`

`getFieldError()` may return an object (e.g. `ValidationError`), not a simple string. Using `String(obj)` silently produces `[object Object]`:

```tsx
// ❌ lint error: may use Object's default stringification format
<span>{String(getFieldError("event_name"))}</span>

// ✅ Serialize properly
<span>{JSON.stringify(getFieldError("event_name"))}</span>
```

---

## Harness return type — use the ambient `ReactElement`, never import it

This project declares `ReactElement` as a global ambient type. **Never import it from `'react'`**:

```tsx
// ❌ lint error: no-reactelement-import
import type { ReactElement } from "react";
function Harness(): ReactElement { ... }

// ✅ Use the ambient type directly — no import needed
function Harness(): ReactElement { ... }
```

Note that TypeScript still requires an explicit return type annotation (`ReactElement`) due to the `@typescript-eslint/explicit-function-return-type` rule. Use the ambient type without an import statement.

---

## DOM query scoping — always `within(rendered.container)`

Bare `getByTestId("foo")` queries the **entire `document.body`**. When a test file has multiple `render(...)` calls (even across separate tests if `cleanup()` was missed), this throws "Found multiple elements". **Always scope to the specific render container:**

```tsx
// ❌ Queries entire body — fails with "Found multiple elements" if other renders exist
const { getByTestId } = render(<Harness />);
fireEvent.click(getByTestId("submit-btn"));

// ✅ Scoped to this render only
const rendered = render(<Harness />);
fireEvent.click(within(rendered.container).getByTestId("submit-btn"));
```

Import `within` from `@testing-library/react` alongside other query helpers.

---

## References

- [unit-testing-hooks-harness](../unit-testing-hooks-harness/SKILL.md) — Core Harness pattern, completeness, test structure
- [unit-testing-hooks](../unit-testing-hooks/SKILL.md) — renderHook, installStore, test structure
- [unit-testing-pitfalls](../unit-testing-pitfalls/SKILL.md) — act, magic numbers, async races
- [react-conventions](../react-conventions/SKILL.md) — React Compiler rules
````
