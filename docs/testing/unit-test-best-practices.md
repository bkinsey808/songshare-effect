# Unit Testing Reference

Comprehensive guide for Vitest unit tests in this repo. Covers core setup, mocking strategies,
API handler testing, and common pitfalls. For React hook tests see
[unit-test-hook-best-practices.md](/docs/testing/unit-test-hook-best-practices.md).

## Table of contents

- [When to write a test (and when not to)](#when-to-write)
- [Quick-start routing guide](#routing-guide)
- [Core setup](#core-setup)
- [AAA testing pattern](#aaa-testing-pattern)
- [Mocking](#mocking)
- [API handler testing](#api-handler-testing)
- [Common pitfalls](#common-pitfalls)
- [Advanced tradeoffs](#advanced-tradeoffs)
- [Validation commands](#validation-commands)
- [References](#references)

---

<a id="when-to-write"></a>

## When to Write a Test (and When NOT to)

**When NOT to write a test:**

- **Trivial getters / pure config objects** — a function that returns a constant or reads a single
  field provides no falsifiable behavior worth asserting.
- **Generated or vendored code** — files under `generated/` or third-party wrappers you don't own.
- **Test-util helpers themselves** — helpers like `asPostgrestResponse` or `makeCtx` are
  infrastructure, not behavior; they don't need their own specs.
- **One-liner re-exports** — if the only logic is `export default someLib.method`, the test would
  just verify that JS imports work.

If you find yourself writing a test that asserts an import exists, or that a constant equals itself,
skip it.

If a function or its result is mocked in a test, avoid adding a separate unit test that asserts
the mocked function's own implementation; instead, assert the behavior of the system under test
that depends on that mock.

---

<a id="routing-guide"></a>

## Quick-Start Routing Guide

Loading only this doc is rarely sufficient. Use this as a routing guide before writing any code:

**Hook test** (any `use*.ts` / `use*.tsx` file):

- Read [unit-test-hook-best-practices.md](/docs/testing/unit-test-hook-best-practices.md) — renderHook, installStore, Harness
  requirement, fixtures, subscriptions, lint traps, and pre-completion checklist

**API handler test** (`api/src/**/*.test.ts`):

- [API Handler Testing](#api-handler-testing) — makeCtx, makeSupabaseClient, MockRow,
  Effect.runPromise
- [Mocking](#mocking) — non-factory `vi.mock`, `vi.spyOn` exception patterns
- [Common Pitfalls](#common-pitfalls) — async/assertion mistakes

**Pure utility / module test** (non-hook, non-API):

- This file covers most of what you need (templates, named constants, validation commands)
- [Mocking](#mocking) — if external modules need to be mocked
- [Common Pitfalls](#common-pitfalls) — anti-patterns checklist

---

<a id="core-setup"></a>

## Core Setup

_Helper modules intended solely for unit tests should use the `.test-util.ts` / `.test-util.tsx`
suffix so their purpose is obvious and they don't get mistaken for production code._

1. Use the included [`test-template.test.ts`](/.github/skills/unit-test-best-practices/test-template.test.ts) as a starting point for new tests.
2. Prefer descriptive test names and one behavior per test.
3. Use `vi.useFakeTimers()` only when verifying timer behavior; always restore with
   `vi.useRealTimers()`.
4. **RouterWrapper** — most hook tests need React Router context. Import `RouterWrapper` from
   `@/react/lib/test-utils/RouterWrapper` and pass it as the `wrapper` option to `renderHook`.
5. Mock only external dependencies (network calls, browser APIs). Simple, deterministic pure
   functions should be tested with their real implementations. **Never mock Node.js built-ins**
   (`node:fs/promises`, `node:path`, etc.); use real `mkdtemp`/`rm` temp directories instead (see
   [Mocking Node.js Built-ins](#-mocking-nodejs-built-ins-nodefs-nodepath-etc)).
6. Use shared helpers under `react/src/lib/test-utils` (`asNull`, `asNever`, `asPostgrestResponse`,
   `waitForAsync`, `makeChangeEvent`, `spyImport`, `makeAppSlice`).
7. Before running your spec, **make sure lint passes**. New test files will fail to execute if the
   codebase is not clean.
8. Prefer asserting against named constants rather than duplicated literal strings. Define
   `const songId = "s1"` and use that variable in both setup and expectations.
9. Always use `toStrictEqual` instead of `toEqual` — the linter enforces this.
10. Use `toSorted()` instead of `sort()` for non-mutating sorted comparisons:
    `expect(result.toSorted()).toStrictEqual(expected.toSorted())`.

### Practical rules

- **Wrap all tests in a `describe` block** — `eslint-plugin-jest/require-top-level-describe` enforces
  this. All `test`/`it` calls at the top level fail lint.
- **Use `it` inside `describe`** — `eslint-plugin-jest/consistent-test-it` enforces `it` within
  `describe` blocks.
- **Prefer `it.each` for input/output matrices** — when the same behavior is asserted across
  multiple cases, use a table-driven test instead of duplicating near-identical `it` blocks.
  - Prefer named-case rows (objects with a `name` field) for clearer failure messages and
    better documentation of each scenario. This makes test failures readable without opening
    the table data and serves as lightweight documentation for the behavior under test.

  - Example (preferred):

    ```ts
    const cases = [
    	{ name: "root pathname", input: "/", expected: "/" },
    	{ name: "empty pathname", input: "", expected: "/" },
    ];

    it.each(cases)("$name", ({ input, expected }) => {
    	// Act
    	const result = getPathWithoutLang(input);

    	// Assert
    	expect(result).toBe(expected);
    });
    ```

  - Use `%s` placeholders only when the scenario name is already descriptive, or when the

  - Named object rows support named placeholders in titles (Vitest/Jest-style `$var`).
    Prefer this when rows have multiple fields or when you want clearer, parameterized
    failure messages. Example using a `$role` placeholder and object rows:

    ```ts
    it.each([{ role: "owner" }, { role: "community_admin" }, { role: "member" }])(
    	"decodes input and preserves role $role in the decoded output",
    	({ role }) => {
    		// Arrange
    		const input = { community_id: ID1, user_id: ID2, role } as unknown;

    		// Act
    		const result = decodeUnknownSyncOrThrow(communityUserAddSchema, input);

    		// Assert
    		expect(result.role).toBe(role);
    	},
    );
    ```

    Notes:
    - Object rows let you name each column (`{ role, desc, expected }`) and use `$col`
      interpolation in the test title. This reads very well in test output.
    - If your rows are simple tuples (e.g. `[["empty",""], ["two","ab"]]`) you
      can still use `%s` positional placeholders, but prefer object rows for clarity.
    - Keep `Arrange` shared when possible (move common setup to the `describe` scope)
      and perform only the `Act` + `Assert` inside the row callback to avoid noise.
      table rows are simple tuples; otherwise prefer the named-case pattern above.

- **Every numeric literal needs a named constant** — `no-magic-numbers` applies even to `0`, `1`,
  and arithmetic offsets like `index + 1`. Define constants at the top of the file
  (e.g. `const LINE_OFFSET = 1`, `const NO_ERRORS = 0`).
- **Use `toHaveLength()` for array length assertions** — `expect(arr).toHaveLength(0)` not
  `expect(arr.length).toBe(0)`.
- **Avoid single-character callback parameter names** — `id-length` rejects `_` and `i` even in
  `Array.from` callbacks. Use `_el, index` instead.
- **Every string literal used more than once needs a named constant** — e.g. `const NEWLINE = "\n"`
  instead of inline `"\n"`.
- **Function parameters: use options objects to avoid `max-params`** — ESLint's `max-params`
  (max 3) will flag functions with many positional injectable args. Group them into a single
  `opts: Options = {}` parameter.
- **Use `forceCast<T>(value)`** from `@/react/lib/test-utils/forceCast` for type-safe coercion in
  tests; never use inline `as unknown as T`.
- **Document test helpers with JSDoc**: purpose, params, and why any cast is acceptable.
- **No lint disable comments in test files** — Do not use `oxlint-disable` or `eslint-disable` in
  `*.test.ts` or `*.test.tsx`. Fix the code or extract helpers into `*.test-util.*` files. Disables
  in test-util files are acceptable only when there is no alternative.

<a id="aaa-testing-pattern"></a>

## AAA Testing Pattern (Arrange, Act, Assert)

We recommend the AAA pattern for unit tests: Arrange (set up data, mocks, and the system under
test), Act (exercise the behavior), Assert (verify outcomes). Using explicit AAA sections or
comments keeps tests focused, readable, and easy to reason about.

Example (Vitest + TypeScript):

```ts
it("calculates total price", () => {
	// Arrange
	const items = [{ price: 10 }, { price: 5 }];

	// Act
	const total = calculateTotal(items);

	// Assert
	expect(total).toBe(15);
});
```

Guidance:

- Keep `Arrange` minimal and local to the test; extract reusable setup into `*.test-util.*` helpers.
- Configure mock return values in the `Arrange` step (e.g. `vi.mocked(api).mockResolvedValue(...)`).
- Put the single invocation under test in `Act` — avoid splitting the action across multiple
  statements unless the scenario explicitly requires it.

- Prefer separating `Act` and `Assert`: compute the result(s) in a distinct `// Act` step,
  then verify them in a dedicated `// Assert` step. Avoid `// Act & Assert` except when the
  action is performed inline inside the assertion (for example `await expect(sut()).resolves...`).
  - `Act` placement: the `// Act` comment should appear immediately above the statement that
    exercises the system under test (the single invocation). Do not place `// Act` above the
    first `expect` — that is an assertion, not the action.

When using table-driven tests with `it.each`, prefer using the supplied row values directly
inside the test callback and avoid adding `// Arrange` comments within the callback body.
Because each row explicitly documents the inputs, an additional `// Arrange` section for
each case often adds noise without improving clarity. Keep the row handler concise: accept
the parameters, perform the action, then assert.

Example (preferred):

```ts
it.each([
	["non-empty", "a"],
	["two-chars", "ab"],
])("returns true for %s", (label, input) => {
	// Act
	const result = isString(input);

	// Assert
	expect(result).toBe(true);
});

it.each([["empty", ""]])("returns false for %s", (label, input) => {
	// Act
	const result = isString(input);

	// Assert
	expect(result).toBe(false);
});
```

Avoid adding a repeated `// Arrange` block inside `it.each` callbacks. If setup is shared
across rows, extract it to the top of the `describe` or into a `*.test-util.*` helper.

    	- Avoid empty sections: do not add a `// Arrange` or `// Act` comment unless that section
    			actually contains non-trivial setup or the action. Empty markers create noise and should be omitted.

    	- Do NOT add trivial `// Arrange` blocks that only copy the row value into a local variable.
    		This is an anti-pattern because it increases noise and triggers lint rules that prohibit
    		empty or meaningless `Arrange` sections. Instead, use the row value directly in the `Act`.

    		Bad (anti-pattern):

    		```ts
    		it.each([{ token: "a" }])("does something $token", ({ token }) => {
    			// Arrange
    			const input = token;

    			// Act
    			const result = doThing(input);

    			// Assert
    			expect(result).toBe(true);
    		});
    		```

    		Good (preferred):

    		```ts
    		it.each([{ token: "a" }])("does something $token", ({ token }) => {
    			// Act
    			const result = doThing(token);

    			// Assert
    			expect(result).toBe(true);
    		});
    		```

- Prefer clear `Assert` statements that verify behavior (return values, side effects, calls that are
  part of the contract) rather than implementation details.
- For async behavior, perform the `Act` with `await` and assert afterwards (or use `await act(...)`
  / `waitFor` where appropriate).

#### AAA placement conventions

- Arrange: place setup and fixture variables at the top of the test body, immediately after the `it(...)` opening. If you need to configure mocks or install stubs, the `// Arrange` comment should appear before those statements.
- Act: place `// Act` immediately above the single statement that exercises the system under test (the invocation under test). If the action is wrapped in `act(...)`, place `// Act (using act())` above that call.
- Assert: place `// Assert` directly before the assertions. For tests that perform the action inline inside an assertion (e.g. `await expect(sut()).resolves.toBe(...)`), the action is considered part of the assertion and you may omit a separate `// Act` comment — use `// Arrange` and `// Assert` only.
- Table-driven tests: when using `it.each`, prefer a single `// Assert` section inside the row handler when each case only needs assertions. Avoid duplicating empty `// Arrange` markers for each row; extract common setup to the top of the `describe` or into a helper.
- Avoid empty markers: do not leave `// Arrange`, `// Act`, or `// Assert` comments with no code beneath them — empty markers create noise and reduce readability.

Example — explicit AAA:

```ts
it("calculates total price", () => {
	// Arrange
	const items = [{ price: 10 }, { price: 5 }];

	// Act
	const total = calculateTotal(items);

	// Assert
	expect(total).toBe(15);
});
```

Example — `resolves` inline action (no separate Act):

```ts
it("saves data and returns id", async () => {
	// Arrange
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"id":"x"}', { status: 200 })));

	// Assert
	await expect(saveData({ a: 1 })).resolves.toMatchObject({ id: "x" });
});
```

### Script / pure-logic module testing

When a `.bun.ts` entry-point script contains non-trivial logic, extract that logic into a **pure,
Node-importable module** (e.g. `checkSkillFiles.ts`) and test the module directly. This avoids
spawning `bun` in tests, which is fragile in environments where Bun is not globally installed.

```ts
// checkSkillFiles.ts — pure module, import-able under Node
export async function checkSkillFiles(repoRoot: string, opts: CheckOptions = {}): Promise<CheckResult> { ... }

// checkSkillFiles.test.ts — tested with Vitest, no bun spawn needed
import { checkSkillFiles } from "./checkSkillFiles";
```

The `.bun.ts` entry point becomes a thin shell that reads `import.meta.dir`, calls the pure
function, and handles `process.exit` / stream writes. It does **not** need its own test file.

---

<a id="mocking"></a>

## Mocking

<a id="non-factory-mock"></a>

### Non-Factory `vi.mock` Pattern (Required)

Use single-argument `vi.mock("path")` as the default. Avoid the factory pattern (`vi.mock("path", () => {...})`) except when the non-factory approach cannot express the required setup. Configure behavior with `vi.mocked(...)` in tests or setup helpers. This keeps mocks predictable in ESM-heavy code and avoids brittle hand-built module shapes.

**Preferred - non-factory mock registration + per-test `vi.mocked(...)`:**

```ts
import fetchEventCommunities from "@/react/event/fetch/fetchEventCommunities";
import subscribeToCommunityEventByEvent from "@/react/event/subscribe/subscribeToCommunityEventByEvent";

vi.mock("@/react/event/fetch/fetchEventCommunities");
vi.mock("@/react/event/subscribe/subscribeToCommunityEventByEvent");

it("uses mocked dependencies", () => {
	vi.mocked(fetchEventCommunities).mockReturnValue(Effect.succeed([]));
	vi.mocked(subscribeToCommunityEventByEvent).mockReturnValue(Effect.succeed(() => undefined));
});
```

Use a factory only when the non-factory pattern cannot express the setup (e.g. modules that export
constants or require hoisted closure state). When a factory is unavoidable, keep it minimal and typed.

Treat `vi.importActual` as a code smell by default in this repo. In most tests, if you need a
mocked dependency, prefer non-factory `vi.mock("path")` + `vi.mocked(...)` and avoid partial module
merging. Use `vi.importActual` only for explicit, documented partial-mock exceptions where the
non-factory pattern cannot express the behavior under test.

<a id="mock-factory-pattern"></a>

### When to Use the `vi.mock` Factory Pattern (Required Guidance)

There are exactly two cases in this repo where the factory pattern is tolerated for new code. Always
add a comment explaining why the factory is required when you use it.

**Case 1: Module-level initialization**

Use a factory when a mocked function is called during another module's top-level initialization.
This happens at import time, before a test can call `mockReturnValue`.

```typescript
// api-client.ts (source module under test)
import { getConfig } from "./config";

// Runs ONCE at import time — not inside any function
export const BASE_URL = getConfig().apiUrl;
```

```typescript
// api-client.test.ts
// ❌ Non-factory fails: auto-mock returns undefined, BASE_URL is already frozen
vi.mock("./config");
const mockGetConfig = vi.mocked(getConfig);
// Too late — api-client already ran getConfig() during import
mockGetConfig.mockReturnValue({ apiUrl: "https://test.example.com" });

// ✅ Factory works: runs at hoist time, before api-client.ts initializes
vi.mock("./config", () => ({
	getConfig: vi.fn().mockReturnValue({ apiUrl: "https://test.example.com" }),
}));
import { fetchData } from "./api-client"; // BASE_URL is set correctly ✅
import { getConfig } from "./config";

const mockGetConfig = vi.mocked(getConfig);
```

This pattern is rare in React codebases — components and hooks call things at render or effect time,
not during module initialization.

**Case 2: Auto-mock cannot produce a spy-able export**

Vitest's auto-mock replaces exports with `vi.fn()`. This works for plain functions and hooks, but
fails for exports that are not plain functions, such as `forwardRef` components, class instances, or
re-exports from complex package internals. In those cases,
`vi.mocked(export).mockImplementation` is not a function at runtime.

The canonical example in this codebase is `Link` from `react-router-dom`:

```typescript
// ❌ Auto-mock fails: Link is a forwardRef component, not a plain function.
// vi.mocked(Link).mockImplementation is not a function at runtime.
vi.mock("react-router-dom");
vi.mocked(Link).mockImplementation((props) => <a href={props.to}>{props.children}</a>);

// ✅ Factory works: the export is defined directly, bypassing auto-mock.
// The comment explaining WHY the factory is needed is required.
// The Link is weird in how it comes out of the router-dom so a factory is required.
vi.mock("react-router-dom", () => ({
	Link: (props: React.ComponentProps<typeof Link>) => (
		<a href={props.to as string}>{props.children}</a>
	),
}));
```

**How to tell which case you're in:** try `vi.mock("module")` first and run the tests. If you see
`vi.mocked(...).mockImplementation is not a function`, the export is not a plain function and you
need the factory. If tests pass but produce wrong behavior, you likely have a module-init timing
issue (Case 1).

These are the only two cases in this project where the factory pattern is tolerated for new code.

### Supabase / Postgrest Mocking

Centralize unsafe casts in `asPostgrestResponse(value)` under `react/src/lib/test-utils`. Never
hand-craft the `{ data, error, count, status, statusText }` shape inline.

```ts
import callSelect from "@/react/lib/supabase/client/safe-query/callSelect";
import asPostgrestResponse from "@/react/lib/test-utils/asPostgrestResponse";

vi.mock("@/react/lib/supabase/client/safe-query/callSelect");
const mockedCallSelect = vi.mocked(callSelect);

mockedCallSelect.mockResolvedValue(asPostgrestResponse({ data: [{ id: "r1" }] }));
```

When mocking external services like Supabase, ensure the mock structure matches the real library's
response format, especially for error cases:

```typescript
return Promise.resolve({ data: null, error: { message: "Database failure" } });
```

<a id="mock-vs-spyon"></a>

### `vi.mock()` vs `vi.spyOn()` - Default to `vi.mock()`

In this repository, use `vi.mock()` as the default for dependencies imported by the SUT. This is
more predictable in ESM-heavy code and gives stronger module-boundary isolation.

```ts
// ✅ Preferred default: non-factory module mock
vi.mock("@/shared/utils/formatEventDate");
vi.mocked(formatEventDate.clientLocalDateToUtcTimestamp).mockReturnValue("2026-01-01T00:00:00Z");
```

Use `vi.spyOn()` only when you intentionally want to keep the real module implementation and patch
just one property for a test:

```ts
const mod = await import("@/shared/utils/formatEventDate");
vi.spyOn(mod, "clientLocalDateToUtcTimestamp").mockReturnValue("2026-01-01T00:00:00Z");
```

| Situation                                             | Pattern                              |
| ----------------------------------------------------- | ------------------------------------ |
| Imported collaborator / repeated control across tests | `vi.mock("path")` + `vi.mocked(...)` |
| Advanced module-shape override                        | `vi.mock("path", factory)`           |
| One-off partial override on a stable object reference | `vi.spyOn(object, "method")`         |

Use `vi.spyOn()` as an escape hatch, not the baseline pattern.

<a id="domock"></a>

### `vi.doMock()` - Runtime Exception Path

Use `vi.doMock()` only when non-factory top-level `vi.mock("path")` cannot express the test setup.
Typical case: per-test runtime-dependent mocking before importing the SUT.

Preferred flow for `vi.doMock()`:

1. Create a local `async init()` helper inside `describe`.
2. Call `vi.resetModules()` inside `init()` before imports.
3. Install `vi.doMock(...)` in `init()`.
4. Dynamically `import()` the SUT and mocked dependency in `init()`.
5. Return all handles needed by the test.

Do not use `vi.doMock()` as a default replacement for top-level non-factory `vi.mock`.

### Never mock an entire shared library

Avoid `vi.mock("effect")` entirely for libraries like `effect` that export values used across the
whole repo. This applies to both non-factory and factory patterns.

Best practice order for Effect tests:

1. Do not mock `effect` at all.
2. Mock your own dependency boundary and return real `Effect` values.
3. Use targeted `vi.spyOn` on `effect` only when no practical boundary exists.

- Non-factory `vi.mock("effect")` can auto-mock broad module surfaces unexpectedly.
- Factory `vi.mock("effect", () => ...)` can accidentally omit exports, leaving them `undefined`.

```ts
// ❌ Avoid non-factory module-level mocking of effect
vi.mock("effect");

// ❌ Avoid factory module-level mocking of effect
vi.mock("effect", () => ({ Effect: { runPromise: vi.fn() } }));

// ✅ Prefer mocking your own dependency boundary with real Effect values
fetchEventBySlug: (_slug: string) => Effect.sync(() => undefined);

// ✅ If absolutely required, use targeted spyOn without replacing the full module:
vi.spyOn(effectModule, "runPromise").mockResolvedValue(undefined);
```

**Rule:** only mock modules that the code under test **directly imports**, and prefer your own
application modules over third-party shared libraries. Verify with a quick
`grep` before adding a `vi.mock`.

### ESM & Effect Mocking

**Avoid top-level mock state** — declaring mutable variables at the top level triggers
`jest/require-hook`. Arrange mock state directly inside each `it` block using local constants.

```ts
// ❌ triggers jest/require-hook
let appState = {};

// ✅ arrange inside the test
it("works", async () => {
	const appState = {};
	vi.mocked(myFn).mockReturnValue(appState);
});
```

**Mocking Effects** — in ESM environments, `vi.spyOn(Effect, "runPromise")` may fail with
`TypeError: Cannot redefine property`. Instead, have your mocked dependency return a **spy Effect**:

```ts
const effectSpy = vi.fn();
vi.mocked(mockedFetch).mockReturnValue(Effect.sync(() => effectSpy()));
expect(effectSpy).toHaveBeenCalled();
```

**Avoid lifecycle hooks** — the lint rule `jest/no-hooks` errors on `beforeAll`/`beforeEach`/`after*`.
Use an **`async init()` helper** inside the `describe` block instead:

```ts
describe("foo handler", () => {
	async function init() {
		vi.resetModules(); // clear module registry for fresh imports
		mockFoo(); // install any vi.doMock calls
		const { default: handler } = await import("./fooHandler");
		const { foo } = await import("./foo");
		return { handler, mockedFoo: vi.mocked(foo) };
	}

	it("calls foo with the expected argument", async () => {
		const { handler, mockedFoo } = await init();
		mockedFoo.mockReturnValue(42);
		const res = handler();
		expect(res).toBe(42);
	});
});
```

Key points: `vi.resetModules()` must be called before dynamic imports so each test gets a fresh
module instance. Return everything the test needs from `init()`.

**Mocking static properties on Zustand stores (`useAppStore.getState`)** — the auto-mock does
**not** stub static properties. Use `vi.spyOn`:

```ts
vi.mock("@/react/app-store/useAppStore");

it("passes getState to the subscribe function", async () => {
	vi.spyOn(useAppStore, "getState").mockReturnValue(forceCast({}));
	renderHook(() => {
		mySubscriptionHook("community-1");
	});
	await waitFor(() => {
		expect(vi.mocked(mySubscribeFn)).toHaveBeenCalledWith("community-1", useAppStore.getState);
	});
});
```

Use exact reference (`useAppStore.getState`) — not `expect.any(Function)` — to catch regressions.

### Shared Mock Helper Infrastructure

Three patterns exist; pick the right one upfront:

| Situation                                            | Pattern                                     | Location         |
| ---------------------------------------------------- | ------------------------------------------- | ---------------- |
| Single test file needs fresh module imports per test | `async init()` inside `describe`            | Inline           |
| Multiple test files mock the same module             | Callable `mockFoo()` function               | `*.test-util.ts` |
| Multiple helper files share the same mock state      | `vi.hoisted()` state + `mockFoo()` + getter | `*.test-util.ts` |

Treat `vi.hoisted()` as a code smell by default in this repo. Most tests should use top-level
`vi.mock("path")` plus per-test `vi.mocked(...)` setup. Reach for `vi.hoisted()` only when hoist
timing is required for shared mock state across helper modules.

Start with `async init()`. Extract to a callable helper only when two or more test files need the
same mock. Add `vi.hoisted()` only when a second helper file needs to read or configure the same
mock function.

**Callable mock setup functions:**

```typescript
// react/src/event/manage/test-utils/mockUseSlideManagerView.ts
import { vi } from "vitest";

let mockFn: ReturnType<typeof vi.fn> | undefined = undefined;

/**
 * Set up the mock for useSlideManagerView.
 * Must be called explicitly in each test before using the hook.
 * @returns The mock function for inspection
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
	vi.resetModules();
	mockFn = vi.fn();
	vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({ default: mockFn }));
	return mockFn;
}

export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
	return mockFn;
}
```

**Global mock storage with `vi.hoisted()`** when multiple helper files share one mock:

```typescript
const mockState = vi.hoisted(() => ({
	mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
}));

export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
	vi.resetModules();
	mockState.mockFn = vi.fn();
	vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
		default: mockState.mockFn,
	}));
	return mockState.mockFn;
}

export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
	return mockState.mockFn;
}
```

**Typed mock retrieval helpers** for generic modules:

```ts
export async function getValidateFormEffectMock(): Promise<ValidateFormEffectMock> {
	const { default: validateFormEffect } = await import("@/shared/validation/validateFormEffect");
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return vi.mocked(validateFormEffect) as unknown as ValidateFormEffectMock;
}
```

**Helper module rules:**

1. **No top-level `vi.mock` calls in helper modules.** Export a callable function (`mockFoo()`) that
   calls `vi.doMock` when invoked.
2. **No lint disable comments in test files** — test-util files may use disables only when unavoidable.
3. See real examples in `react/src/form/test-util.ts` and
   `react/src/lib/supabase/client/getSupabaseClient.test-util.ts`.

### `forceCast` and the `installStore` selector dispatch pattern

When mocking `useAppStore` with `vi.mocked(...).mockImplementation(...)`, use `forceCast` to invoke
the real selector against typed mock state. Avoid `String(selector).includes(...)` string
inspection — it breaks with minification and function renames.

```tsx
import forceCast from "@/react/lib/test-utils/forceCast";

const mockFetchUserLibrary = vi.fn(() => Effect.sync(() => undefined));
const mockState = { fetchUserLibrary: mockFetchUserLibrary };

function installStore() {
	mockedUseAppStore.mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
	return { fetchUserLibrary: mockFetchUserLibrary };
}
```

Use `forceCast<T>(value)` anywhere you need to coerce a test value past a type mismatch — partial
event objects, synthetic event stubs, partial store states, etc. **Never** use inline
`as unknown as T`; it triggers `typescript/no-unsafe-type-assertion`.

---

<a id="api-handler-testing"></a>

## API Handler Testing

Focused guidance for testing Effect-based Hono API handlers in `api/src/`.

### Setup: Mock External Modules

```typescript
import { createClient } from "@supabase/supabase-js";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";
import { AuthenticationError } from "@/api/api-errors";
import makeCtx from "@/api/hono/makeCtx.test-util";
import mockCreateSupabaseClient from "@/api/test-utils/mockCreateSupabaseClient.test-util";
import accountDelete from "./accountDelete";

vi.mock("@supabase/supabase-js");
vi.mock("@/api/cookie/buildClearCookieHeader");
vi.mock("@/api/user-session/getVerifiedSession");
vi.mock("@/api/csrf/verifySameOriginOrThrow");
vi.mock("@/api/csrf/verifyDoubleSubmitOrThrow");
```

### Test Helpers: Use Existing Factories

**Proactively check for existing mocks** in `api/src/test-utils/` and its `supabase-mocks/`
subfolder before writing local stubs.

- **`mockCreateSupabaseClient(mockedFn, opts)`** — Standard Supabase client mock. Accepts typed
  options across tables.
- **`makeCtx(opts)`** — Creates a minimal `ReadonlyContext`. Pass `env` overrides or
  `resHeadersAppend` spies.
- **`makeSupabaseClient(opts)`** — Fake Supabase client. Pass mock rows or errors.
- **`makeSimpleClient(opts)`** — Minimal client for endpoints exercising one table.
  Located at `@/api/test-utils/makeSimpleSupabaseClient.test-util`.

```typescript
const ctx = makeCtx({
	env: { VITE_SUPABASE_URL: "url", SUPABASE_SERVICE_KEY: "svc-key" },
	resHeadersAppend: vi.fn(),
});

mockCreateSupabaseClient(vi.mocked(createClient), {
	playlistSelectSingleRow: { user_id: "requester-1" },
	playlistDeleteError: new Error("boom"),
});
```

### `MockRow<T>` and `exactOptionalPropertyTypes`

Use `MockRow<T>` from `@/api/test-utils/supabase-mocks/supabase-mock-types`. It explicitly allows
`null | undefined` for all properties, correctly mirroring Supabase nullable columns under strict
compiler settings.

```typescript
import { type MockRow } from "@/api/test-utils/supabase-mocks/supabase-mock-types";
import { type Playlist } from "@/shared/generated/supabaseSchemas";

const myMockRow: MockRow<Playlist> = {
	playlist_id: "uuid",
	public_notes: undefined, // OK with MockRow even if required in schema
};
```

### Mocking Effect Functions

**Static mocks** (simple side effects like CSRF checks):

```typescript
vi.mocked(verifySameOriginOrThrow).mockReturnValue(undefined);
vi.mocked(verifyDoubleSubmitOrThrow).mockReturnValue(undefined);
```

**Dynamic imports with `vi.spyOn`** (functions returning Effects, exception path when a top-level
`vi.mock` setup is not practical):

```typescript
const verifiedModule = await import("@/api/user-session/getVerifiedSession");
vi.spyOn(verifiedModule, "default").mockReturnValue(
  Effect.succeed<UserSessionData>({
    user: { user_id: "123", ... },
    ...
  }),
);

// For failure cases:
vi.spyOn(verifiedModule, "default").mockReturnValue(
  Effect.fail(new AuthenticationError({ message: "Not authenticated" })),
);
```

### Running the Handler and Asserting Results

```typescript
// Happy path
const res = await Effect.runPromise(accountDelete(ctx));
expect(res).toStrictEqual({ success: true });
expect(appendSpy).toHaveBeenCalledWith("Set-Cookie", "clear-cookie");

// Error case
await expect(Effect.runPromise(accountDelete(ctx))).rejects.toThrow(/Database error/);

// Early return (e.g. CSRF failure)
const res = await Effect.runPromise(accountDelete(ctx));
expect(res).toBeInstanceOf(Response);
expect(res.status).toBe(HTTP_FORBIDDEN);
```

See `api/src/account/accountDelete.test.ts` for a full worked example.

### Minimal `ReadonlyContext` for small helpers

```ts
/**
 * Return a minimal ReadonlyContext for CSRF tests.
 * @param headerValue - value returned by `req.header`
 * @param cookieValue - cookie string or undefined
 */
function makeCtxForCsrf(headerValue?: string, cookieValue?: string): ReadonlyContext {
	const headers = new Headers();
	if (cookieValue) headers.set("Cookie", `${csrfTokenCookieName}=${cookieValue}`);
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return { req: { header: () => headerValue, raw: { headers } } } as unknown as ReadonlyContext;
}
```

---

<a id="common-pitfalls"></a>

## Common Pitfalls

### ❌ Magic Numbers and Strings

Extract literals to named constants. This keeps intent clear, satisfies `no-magic-numbers`, and
makes updates easier.

### ❌ `as any` in Test Bodies

Avoid `as any` or unsafe type assertions in test bodies — they hide type errors. Use type guards or
check for property existence when the type checker demands it.

### ❌ Manual Global Overrides

Use Vitest's `vi.stubGlobal` instead of `global.crypto = ... as any`.

### ❌ Assuming Utility Output Without Checking the Implementation

Always check what the real function returns before writing an assertion. Open the source file,
note the actual return format, then assert against that value.

### ❌ Collecting Mock Call Arguments in a Side-Effect Array

Vitest already records every call on the mock function itself. Use `toHaveBeenCalledWith` or
`.mock.calls` directly — no accumulator array needed.

```ts
// ❌ Unnecessary accumulator
const savedRequests: Record<string, unknown>[] = [];
const mockSave = vi.fn((req: Record<string, unknown>) => { savedRequests.push(req); ... });

// ✅ Idiomatic
const mockSave = vi.fn(() => Effect.succeed("saved-id"));
expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ event_name: "The Event" }));
```

### ❌ Mocking Modules the Code Doesn't Import

Always verify the module's **actual imports** before writing mocks. Unnecessary mocks mislead
maintainers and mask comprehension gaps.

### ❌ Async Race Conditions

```typescript
// ❌ Not awaiting async operations
it("fetches data", () => {
	fetchData();
	expect(data).toBeDefined(); // runs before fetch completes
});

// ✅ Await
it("fetches data", async () => {
	await fetchData();
	expect(data).toBeDefined();
});
```

### `act` vs `waitFor`

Choose between `act` and `waitFor` based on whether the state change is synchronous or
asynchronous.

**Use `act` for synchronous state updates** triggered by an imperative call outside RTL utilities
(`render`, `userEvent`, or `fireEvent` are not involved):

```tsx
act(() => {
	result.current.clearErrors();
});
```

**Use `waitFor` for async or timing-uncertain completion**, such as effects, data fetching, or
timers:

```tsx
await waitFor(() => {
	expect(result.current.loading).toBe(false);
});
```

**Rule of thumb:**

| Scenario                                        | Use                                           |
| ----------------------------------------------- | --------------------------------------------- |
| Direct `setState` call / imperative hook method | `act`                                         |
| `useEffect` side effects                        | `waitFor`                                     |
| Async mutations / data fetching                 | `await act(async () => { ... })` or `waitFor` |
| Timer-dependent updates                         | `waitFor` (with fake timers if needed)        |

> Using `waitFor` for a synchronous update works but implies async intent, adds polling overhead,
> and makes the test harder to reason about. Prefer `act` when the update is immediate.

### ❌ Duplicated Literal Test Data

```typescript
// ❌ Easy to mistype
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: "s1" });

// ✅ Named constants — same variable in setup and assertion
const songId1 = "s1";
expect(removeSongFromSongLibrary).toHaveBeenCalledWith({ song_id: songId1 });
```

### ⚠️ Lint Disable Comments

- **No lint disables in test files** — Do not add `oxlint-disable` or `eslint-disable` in
  `*.test.ts` or `*.test.tsx`. Fix the code to satisfy the linter, or move the problematic logic
  into a `*.test-util.*` file where a disable may be used only when there is no alternative.

### 🛠️ Type-Cast Helpers

The repo provides `asNull`, `asNever`, `asPostgrestResponse` in `react/src/lib/test-utils`. Each
contains its own `oxlint-disable` and JSDoc explanation so callers stay lint-friendly. Use them
instead of writing `as any` in tests.

### ❌ Mocking Node.js Built-ins (`node:fs/promises`, `node:path`, etc.)

Do **not** try to mock `node:fs/promises` or other Node.js core modules with `vi.mock`. Use the
real filesystem with `mkdtemp` / `rm` to set up and tear down actual temporary directories.

```typescript
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

it("collects only SKILL.md files recursively", async () => {
	const tmp = await mkdtemp(path.join(os.tmpdir(), "my-test-"));
	try {
		await mkdir(path.join(tmp, "sub"), { recursive: true });
		await writeFile(path.join(tmp, "SKILL.md"), "");
		await writeFile(path.join(tmp, "sub", "SKILL.md"), "");
		const result = await myFn(tmp);
		expect(result.toSorted()).toStrictEqual(
			[path.join(tmp, "SKILL.md"), path.join(tmp, "sub", "SKILL.md")].toSorted(),
		);
	} finally {
		await rm(tmp, { recursive: true, force: true });
	}
});
```

### ❌ `as any` Casts on Mocked Functions

```typescript
// ❌
(readdir as any).mockResolvedValue([]);

// ✅
vi.mocked(readdir).mockResolvedValue([]);
```

### ❌ `toEqual` instead of `toStrictEqual`

The linter enforces `toStrictEqual`. `toEqual` ignores `undefined` properties and prototype
differences.

### ❌ `Array#sort()` Instead of `Array#toSorted()`

`sort()` mutates in place. Use `toSorted()` which returns a new sorted array.

---

<a id="advanced-tradeoffs"></a>

## Advanced Tradeoffs

### Behavior vs Implementation Assertions

Prefer behavior-first assertions (return values, state updates, visible side effects). Assert
internal collaborator calls only when the call shape is part of the contract.

### Choose One Mocking Seam

Mock one boundary per test whenever possible (for example: network layer _or_ mapper layer, not
both). Multi-layer mocks can pass while real integration is broken.

### Module Cache Isolation

When using dynamic imports and `vi.doMock`, isolate setup in a local `async init()` helper and call
`vi.resetModules()` inside that helper. This avoids cross-test module cache leakage.

### Deterministic Async

Always await the unit under test. For eventual updates, use `waitFor` with explicit expectations
instead of timing assumptions.

### Avoid Over-Mocking Pure Logic

Keep pure, deterministic, fast helpers real where practical. Mocking simple pure logic increases
fragility and hides integration mistakes.

### Assert Error Semantics, Not Just "Throws"

For Effect-based paths, assert the specific error type and meaningful message fields, not only that
an exception occurred.

### Extract Helpers Only After Repetition

Keep setup inline until the same pattern appears in two or more test files. Early extraction
creates indirection and makes tests harder to read.

---

<a id="validation-commands"></a>

## Validation Commands

**When working on a single file, run tests only for that file** to get faster feedback:

```bash
# Run tests for a specific file
npm run test:unit -- src/utils/myUtil.test.ts

# Run tests with coverage
npm run test:unit -- src/utils/myUtil.test.ts --coverage

# Watch mode (ideal for TDD)
npm run test:unit -- src/utils/myUtil.test.ts --watch

# Run all unit tests (before PR)
npm run test:unit

# Run all tests with coverage
npm run test:unit -- --coverage
```

---

<a id="references"></a>

## References

- [unit-test-hook-best-practices.md](/docs/testing/unit-test-hook-best-practices.md) — Hook-specific patterns
- [effect-implementation.md](/docs/effect-implementation.md) — Effect-TS patterns used in API
- Vitest documentation: https://vitest.dev/
- Testing Library: https://testing-library.com/
- Agent guidance: `.github/agents/Unit Test Agent.agent.md`
