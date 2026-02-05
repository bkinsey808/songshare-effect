---
name: code-comments
description: Code comment conventions and examples (JSDoc vs inline comments, when to explain why vs what, max line length, and placement rules). Use when adding comments to TypeScript/React code or reviewing PR comments.
license: MIT
compatibility: TypeScript 5.x, React 18+
metadata:
  author: bkinsey808
  version: "1.0"
---

# Code Comments Skill

**What this skill does**

- Documents comment conventions used across the repo, including JSDoc rules for TypeScript files and inline `//` rules for implementation notes and tests.
- Provides guidance to maintainers and contributors on where and how to add comments.

**When to use**

- When adding JSDoc above functions/components, or when clarifying non-obvious implementation choices.
- When writing test comments that explain intent or complex setup.

**Rules & Examples**

- **No types in JSDoc** — TypeScript types should not be repeated in comments. Use `@param name - description` and `@returns - description` only.
- **JSDoc for symbols** — Functions, components, and exported types should have JSDoc above them.
- **Don't repeat symbol names in JSDoc** — Do not start the JSDoc with the function or symbol name. The symbol name is already declared by the code; begin with a concise description of purpose and behavior instead.
- **Always include `@returns`** — Every function should include an `@returns` tag. For functions that return `void`, document `@returns void` so the intent is explicit.
- **Inline `//` for logic** — Use `//` above non-symbol blocks like `useEffect` or complex conditionals.
- **Placement** — Comments must be on the line(s) immediately above target code, never on the same line.

- **JSDoc spacing** — Always leave exactly one blank line (a single empty line) above a JSDoc block to visually separate it from preceding code, unless the JSDoc is at the top of the file. Exception: when a JSDoc sits at the top of a code block (for example, immediately after a line ending with `{`), formatters may compress blank lines; in these cases a preceding blank line is optional and either form is acceptable. **Do not** add multiple blank lines — tools and readers expect a single separating line. This makes docs easier to scan and avoids subtle parser/tooling issues that rely on a blank line before doc blocks.

**Bad (two blank lines):**

```ts
const x = 1


/**
 * Description...
 */
function f() {}
```

**Good (one blank line):**

```ts
const x = 1

/**
 * Description...
 */
function f() {}
```

- **Separation between JSDoc and `//` comments** — A JSDoc block must be immediately above the symbol it documents (no blank lines or comments between the JSDoc and the symbol). If you need an explanatory single-line `//` comment, place it _above_ the JSDoc and keep a single blank line between the `//` comment and the JSDoc block (never put `//` comments between a JSDoc block and the symbol). This avoids ambiguous or squished comment layouts and makes tooling more reliable.
- **Prefer integrating notes into JSDoc** — In most cases, concise implementation notes or warnings should be part of the JSDoc text (an extra sentence or an `@remarks` section) rather than a separate `//` comment. This keeps the API documentation cohesive and ensures important notes are captured by documentation tools.

- **Single-object params (props) — document fields directly** — For functions or components that accept a single object parameter (commonly `props`), prefer listing the destructured fields as top-level `@param` entries rather than documenting `@param props` and `@param props.field`. This keeps JSDoc concise and aligned with destructured parameters used in code.

**Bad:**

```ts
/**
 * Small interactive demo component with a text input and counter.
 *
 * @param props - Component props
 * @param props.title - Title to display in the demo card
 * @param props.somethingElse - Some other thing
 * @returns React element with interactive UI controls
 */
export default function InteractiveComponent({ title, somethingElse }: InteractiveComponentParams): ReactElement {}
```

**Good:**

```ts
/**
 * Small interactive demo component with a text input and counter.
 *
 * @param title - Title to display in the demo card
 * @param somethingElse - Some other thing
 * @returns React element with interactive UI controls
 */
export default function InteractiveComponent({ title, somethingElse }: InteractiveComponentParams): ReactElement {}
```

- **Max 100 chars** — Keep lines short; use multi-line JSDoc when necessary.

**Examples**

**Bad (squished - INVALID):**

```ts
/**
 * Does something important.
 *
 * @returns void
 */
// Internal note: this touches global state (do not refactor)
function doSomething(): void {}
```

**Acceptable (separated - VALID):**

```ts
// Internal note: this touches global state (do not refactor)

/**
 * Does something important.
 *
 * @returns void
 */
function doSomething(): void {}
```

**Better (prefer integrated note - PREFERRED):**

```ts
/**
 * Does something important.
 *
 * @remarks
 * Internal note: this touches global state (do not refactor)
 *
 * @returns void
 */
function doSomething(): void {}
```

- See project comment agent: `/.cursor/rules/comment-agent.mdc` and `.github/agents/Comment Agent.agent.md` for canonical examples.

### JSDoc examples

```ts
/**
 * Store a value in the cache for later use.
 *
 * @param value - The value to cache
 * @returns void
 */
function cacheValue(value: string): void {
  // implementation
}
```

```ts
/**
 * Return the currently signed-in user's id, or `undefined` if not signed in.
 *
 * @returns The user id string or `undefined` when not signed in
 */
function getCurrentUserId(): string | undefined {
  return store.userId;
}
```

```ts
/**
 * Small interactive demo component with a text input and counter.
 *
 * @param title - Title to display in the demo card
 * @param somethingElse - Some other thing
 * @returns React element with interactive UI controls
 */
export default function InteractiveComponent({ title, somethingElse }: InteractiveComponentParams): ReactElement {
  return <div />;
}
```

## Validation

Run these to check formatting and types after adding comments:

```bash
npm run lint
npx tsc -b .
```

## References

- Agent guidance: [.github/agents/Comment Agent.agent.md](../../agents/Comment%20Agent.agent.md)
- Project rules: [.agent/rules.md](../../.agent/rules.md)
