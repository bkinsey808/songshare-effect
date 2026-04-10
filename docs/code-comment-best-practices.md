# Code Comments Reference

<a id="toc"></a>
## Table of Contents

1. [Philosophy](#philosophy)
2. [JSDoc — when to use](#jsdoc-when)
3. [JSDoc — formatting rules](#jsdoc-formatting)
4. [JSDoc — params and returns](#jsdoc-params-returns)
5. [JSDoc — what to document](#jsdoc-what)
6. [Inline `//` comments](#inline-comments)
7. [Links in comments](#links-in-comments)
8. [Test file comments](#test-comments)
9. [Constants and grouped symbols](#constants)
10. [Spacing and placement](#spacing-placement)
11. [What NOT to comment](#what-not-to-comment)
12. [Writing style](#writing-style)
13. [Anti-patterns](#anti-patterns)
14. [Maintenance](#maintenance)
15. [Validation](#validation)

---

<a id="philosophy"></a>
## 1. Philosophy

**Explain the "why," not the "what."** The code is the truth; the comment is the reason. Avoid redundant descriptions like `// set age to 32`.

**Value-add only.** If the code is already simple and obvious, do not add a comment.

**Future self.** Provide the context needed to understand decisions six months from now — why a specific workaround was used, what constraint forced a particular shape.

**Documentation vs. clarification:**
- **JSDoc (`/** */`)** — for *consumers* of the code. Describes the API, inputs, and outputs so they don't have to read the implementation.
- **Inline (`//`)** — for *maintainers*. Explains the "why" behind non-obvious logic or performance trade-offs.

**No hazard lights.** A comment warning readers away from bad code is an admission of guilt. If code is complex, explain the *technical constraint* that forced it, rather than apologizing for the complexity. If a comment requires a long paragraph, the code is likely too complex and should be refactored.

**Professionalism.** Never use comments to vent frustration, blame others, or use unprofessional language.

---

<a id="jsdoc-when"></a>
## 2. JSDoc — when to use

Use `/** */` above:
- Exported functions and components
- Exported types and interfaces
- Non-obvious constants (single-line `/** description */` is fine)

Do **not** use JSDoc:
- Above `describe` or `it`/`test` blocks in test files (use `//` instead — see [§6](#test-comments))
- To comment on more than one symbol at a time (see [§7](#constants))
- When a single-line `//` above a non-exported helper is sufficient

---

<a id="jsdoc-formatting"></a>
## 3. JSDoc — formatting rules

**No types in JSDoc for `.ts`/`.tsx` files.** TypeScript provides the types. Use plain descriptions only.

```ts
// ❌
/** @param {string} name - The user name */

// ✅
/** @param name - The user name */
```

**Don't repeat the symbol name** as the first sentence of a JSDoc. The symbol is already declared — begin with a concise description of purpose and behavior.

**Multi-line JSDoc must start with `/**` on its own line** and end with `*/` on its own line:

```ts
// ❌
/** Renders the inner TD content for the full-width delete confirmation UI.
 * Maintainers: This avoids alignment shifts seen in separate-row implementations.
 */

// ✅
/**
 * Renders the inner TD content for the full-width delete confirmation UI.
 * Maintainers: This avoids alignment shifts seen in separate-row implementations.
 */
```

**Single-line JSDoc** is fine for short descriptions that fit on one line:

```ts
/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;
```

**Max 100 characters per line.** Use multi-line JSDoc when a description exceeds that.

---

<a id="jsdoc-params-returns"></a>
## 4. JSDoc — params and returns

**Always include `@returns`.** For `void` functions, write `@returns void` so the intent is explicit.

**Single-object params (props) — document fields directly.** When a function accepts a single object (often `props`), do not create a standalone `@param props` entry. List each field as its own `@param`. This matches destructuring call-site usage and avoids misleading noise.

```ts
// ❌
/**
 * Small interactive demo component.
 *
 * @param props - Component props
 * @param props.title - Title to display
 * @param props.colSpan - Number of columns to span
 * @returns React element
 */

// ✅
/**
 * Small interactive demo component.
 *
 * @param title - Title to display
 * @param colSpan - Number of columns to span
 * @returns React element
 */
```

**Object return values — document properties directly.** Do not write a top-level return object description. List returned properties explicitly:

```ts
// ❌
 * @returns UseSongViewResult - object with the fields described below

// ✅
 * @returns isNotFound - true when the slug did not resolve to a song
 * @returns songData - the raw store payload or `undefined` when not found
 * @returns songPublic - the validated payload, or `undefined` if validation failed
```

**Full example:**

```ts
/**
 * Renders the inner TD content for the full-width delete confirmation UI.
 * Maintainers: This avoids alignment shifts seen in separate-row implementations.
 *
 * @param colSpan - number of columns to span across the grid
 * @returns React element (TD)
 */
```

---

<a id="jsdoc-what"></a>
## 5. JSDoc — what to document

Focus on **behavior and intent**, not on repeating what the type signature already says. Document:

- **What** the function does (start with a verb: "Validates", "Returns", "Fetches")
- **Why** the function exists or is designed this way
- **When** to use it vs alternatives
- **Preconditions** and assumptions
- **Side effects** if any
- **Performance** considerations if relevant

Use `@example` for complex hooks or utilities where usage isn't clear from the signature:

```ts
/**
 * Debounces a callback to limit how often it can be called.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of the callback
 *
 * @example
 * ```ts
 * const debouncedSearch = useDebounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 * ```
 */
```

---

<a id="inline-comments"></a>
## 6. Inline `//` comments

Use `//` above:
- `useEffect` blocks
- Complex conditionals or non-obvious logic
- Performance trade-offs
- TODOs/FIXMEs (see format below)
- Section markers inside longer functions

**Placement:** always on the line(s) immediately *above* the target code. Never on the same line as code.

```ts
// ❌
const result = compute(); // expensive — only runs once

// ✅
// expensive — only runs once
const result = compute();
```

**TODO/FIXME format.** Always include enough context to act on without additional research. Use JSDoc (with `@see`) when the comment includes a link:

```ts
// ✅ Actionable with context
// TODO: Replace with server-driven pagination once API supports it — PROJ-456
// FIXME: Race condition when filters change rapidly — needs debounce
// TODO: Remove this polyfill when we drop IE11 support (Q3 2026)

// ❌ No context, not actionable
// TODO: fix this
// FIXME: doesn't work sometimes
```

When a TODO contains a link, use JSDoc:

```ts
/**
 * TODO: Remove this workaround once upstream fixes the null handling.
 *
 * @see https://github.com/example/library/issues/1234
 */
```

**Section comments** inside longer functions — use `//` to mark logical blocks:

```ts
const processOrder = (order: Order): ProcessedOrder => {
    // Validate order data
    validatePaymentMethod(order.payment);

    // Calculate totals
    const subtotal = calculateSubtotal(order.items);
    const tax = calculateTax(subtotal, order.billingAddress);

    // Apply discounts
    const discount = calculateDiscount(order.customer, subtotal);

    return { subtotal, tax, discount };
};
```

**`//` and JSDoc ordering.** A JSDoc block must be immediately above the symbol it documents — no blank lines or `//` comments between them. If you need an explanatory note, place it *above* the JSDoc with a single blank line between the `//` and the JSDoc:

```ts
// ❌ — // comment between JSDoc and symbol
/**
 * Does something important.
 *
 * @returns void
 */
// Internal note: this touches global state (do not refactor)
function doSomething(): void {}

// ✅ — // comment above the JSDoc
// Internal note: this touches global state (do not refactor)

/**
 * Does something important.
 *
 * @returns void
 */
function doSomething(): void {}

// ✅✅ — preferred: integrate the note into JSDoc
/**
 * Does something important.
 *
 * @remarks
 * Touches global state — do not refactor without tracing all callers.
 *
 * @returns void
 */
function doSomething(): void {}
```

---

<a id="links-in-comments"></a>
## 7. Links in comments

Any comment that contains a URL or cross-reference must use JSDoc (`/** */`), not `//`. This keeps links consistently findable and IDE-navigable.

**`@see` for standalone references** (external URLs, internal file paths, issue trackers). Always on its own line:

```ts
/**
 * Validates JWT tokens per RFC 7519.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7519
 */
```

**`{@link}` for inline references** within prose (code symbols, related functions/types):

```ts
/**
 * Uses {@link validateToken} before processing the request.
 *
 * @param token - Raw JWT string
 * @returns Decoded payload or null if invalid
 */
```

**Do NOT combine them.** `@see {@link ...}` is redundant.

**Workarounds with upstream links:**

```ts
/**
 * WORKAROUND: upstream library does not handle null responses.
 *
 * @see https://github.com/example/library/issues/1234
 * TODO: Remove once issue is fixed in v3.0
 */
```

**Multiple related links:**

```ts
/**
 * @see https://en.wikipedia.org/wiki/Boyer%E2%80%93Moore_string-search_algorithm - Algorithm overview
 * @see https://github.com/example/impl - Reference implementation
 */
```

---

<a id="test-comments"></a>
## 8. Test file comments

Use `//` in test files to describe purpose or complex setup. Do **not** use JSDoc above `describe` or `it`/`test` blocks. Only add a comment above a test block if the test name is not self-explanatory. Keep these comments extremely concise.

```ts
// ❌ — redundant header + over-explained
// Test suite for `subscribeToActivePrivateSongs`.
//
// Ensures the factory returns a no-op unsubscribe, warns correctly when there
// is no Supabase client or no active IDs, and logs errors when token fetching fails.
describe("subscribeToActivePrivateSongs", () => {

// ✅
// Ensures the factory returns a no-op unsubscribe, warns correctly when there
// is no Supabase client or no active IDs, and logs errors when token fetching fails.
describe("subscribeToActivePrivateSongs", () => {
```

Use JSDoc in test files only for shared utility functions that are exported or reused across test files.

---

<a id="constants"></a>
## 9. Constants and grouped symbols

Do **not** use JSDoc to comment on more than one symbol at a time. For groups of related constants, use a single `//` above the group — not a JSDoc that spans all of them:

```ts
// ❌
/** Numeric constants used in assertions to make expected values explicit. */
const ZERO = 0;
const ONE = 1;
const TWO = 2;

// ✅
// Numeric constants used in assertions to make expected values explicit.
const ZERO = 0;
const ONE = 1;
const TWO = 2;
```

For a single non-obvious constant, prefer single-line JSDoc:

```ts
/** Minimum allowed slide index (keeps bounds explicit and avoids magic numbers) */
const MIN_SLIDE_INDEX = 0;
```

---

<a id="spacing-placement"></a>
## 10. Spacing and placement

**One blank line above a JSDoc block.** Leave exactly one empty line before a JSDoc block to visually separate it from preceding code (unless the JSDoc is at the top of the file or immediately after an opening `{`).

```ts
// ❌ — two blank lines
const x = 1;


/**
 * Description...
 */
function f() {}

// ✅ — one blank line
const x = 1;

/**
 * Description...
 */
function f() {}
```

**No blank lines between JSDoc and its symbol.** The JSDoc must attach directly to what it documents.

---

<a id="what-not-to-comment"></a>
## 11. What NOT to comment

**Obvious code** — if the code is self-explanatory, no comment is needed:

```ts
// ❌ redundant
// Increment counter
counter++;

// ✅ no comment needed
counter++;
```

**TypeScript types** — don't repeat type information that's already in the signature:

```ts
// ❌ restates types
/** @param id - Customer ID (string) */

// ✅ describes behavior
/** @param id - Unique identifier used to look up the record */
```

**Code that should be refactored** — if logic is complex enough to need a paragraph of explanation, consider renaming, extracting a function, or simplifying first. Only add the comment if complexity is genuinely unavoidable due to a technical constraint. **"No hazard lights"** — don't apologize for messy code; fix it.

---

<a id="writing-style"></a>
## 12. Writing style

- **Be concise** — brief and focused
- **Full sentences for JSDoc** — start with a capital letter, end with a period
- **Fragments ok for `//`** — no period needed for brief inline comments
- **Active voice** — "Validates input" not "Input is validated"
- **Present tense** — "Returns user data" not "Will return user data"
- **Be specific** — "Retries up to 3 times" not "Retries a few times"
- **No filler words** — avoid "basically", "simply", "just", "obviously"
- **One space after `//`** — `// comment`, not `//comment`

---

<a id="anti-patterns"></a>
## 13. Anti-patterns

**❌ Commented-out code** — use git history instead; delete dead code.

**❌ Version history in comments** — use git log instead.

**❌ Author attribution** — use git blame instead.

**❌ Over-commenting every line** — makes code harder to read, not easier.

**❌ Apologizing or explaining bad code** — refactor instead. If complexity is forced by a real constraint, explain the constraint specifically; don't just say "sorry this is messy."

**❌ Jokes, easter eggs, or passive-aggressive comments** — keep comments professional and constructive. Never vent frustration or blame others.

**❌ Stale TODOs with no context** — review during planning; remove TODOs that have been superseded or are no longer actionable.

---

<a id="maintenance"></a>
## 14. Maintenance

- Update comments in the same commit as the code change — incorrect comments are worse than no comments.
- Delete comments that no longer apply after refactors.
- Remove commented-out code; it pollutes readability and is preserved in git history.
- Treat misleading or excessive comments in code reviews as code smells — the same way you'd treat a bug.

---

<a id="validation"></a>
## 15. Validation

```bash
npm run lint
```
