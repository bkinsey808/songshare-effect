---
name: source-refactoring
description: Patterns for splitting functions and components into their own files. Ensures consistent exports, JSDoc preservation, and test colocation. Use when refactoring large files or extracting reusable logic.
license: MIT
compatibility: TypeScript 5.x, React 18+, Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# Source Refactoring Skill

## What This Skill Does

Provides guidance on splitting existing code (functions, components, hooks) into separate files while maintaining project standards:

- **One function per file** - By default, extract each function into its own dedicated file.
- **Single Symbol Exports** - Use `export default` when a file only exports one main symbol.
- **Naming Conventions**:
  - **Single-symbol files**: Name the file after the symbol (e.g., `camelCase.ts` for functions, `PascalCase.tsx` for components).
  - **Multi-symbol files**: Use `kebab-case.ts` for files that must export multiple symbols.
- **JSDoc Preservation** - Carry over existing documentation and JSDoc comments.
- **Test Colocation** - Move and refactor unit tests into a new `*.test.ts` or `*.test.tsx` file next to the new source file.
- **Import Management** - Update all references to the moved symbol across the codebase.

## When to Use

- When a file grows too large and needs splitting.
- When extracting a utility function or component for better reuse.
- When moving logic out of a component into a specialized hook or service.

## Key Rules

### 1. Default Export for Single Symbols

If the new file only exports one main function or component, use `export default`:

```typescript
// ✅ GOOD: Single exported function
/**
 * @param value - The value to check
 * @returns True if value is a record
 */
export default function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

If the file needs to export multiple related symbols (e.g., related types or small helpers that don't merit their own files), use named exports or a combination:

```typescript
// ✅ GOOD: Multiple related exports
export type FooProps = { ... };
export function Foo() { ... }
```

**Note:** If the file ONLY exports one thing, it MUST be `export default`.

### 2. Use Absolute Imports for Portable Files

When extracting test helpers, utilities, or shared modules that will be imported from multiple locations, use absolute paths (`@/`) to ensure the helper works regardless of the caller's directory depth.

**Why:** Relative paths (`../../../`) break when tests or modules move to different directory levels. Absolute paths (`@/react/event/manage/helpers`) remain stable.

```typescript
// ❌ BAD: Relative path breaks from different caller locations
vi.doMock("../slide/useSlideManagerView", () => ({ default: mockFn }));

// ✅ GOOD: Absolute path works from any location
vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({ default: mockFn }));
```

For test helper files created during refactoring, **always use absolute imports** if the helper will be shared across multiple test suites.

### 3. Avoid Module-Level Side Effects in Test Helpers

Test helpers (mocking functions, setup utilities) should be **callable functions**, not auto-executing code. This keeps test setup explicit and avoids hidden dependencies.

**Problem:** Module-level `vi.doMock()` executes when the module loads, creating implicit test couplings and making mocks hard to reset between tests.

```typescript
// ❌ BAD: Side effect at module level
vi.doMock("./useSlideManagerView", () => ({
  default: vi.fn(),
}));

export function setMockReturn(val: unknown) {
  // ... but mock wasn't set up explicitly
}
```

**Solution:** Move mocking logic into an explicit function. Use `vi.hoisted()` for test-scoped state and `vi.resetModules()` to ensure fresh setup per test:

```typescript
// ✅ GOOD: Callable setup function with vi.hoisted() for state
import { vi } from "vitest";

const mockState = vi.hoisted(
  () =>
    ({
      mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
    }),
);

export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules(); // Clear module cache for fresh mock setup
  mockState.mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockState.mockFn,
  }));
  return mockState.mockFn;
}

// Export helper to access the mock function from other helpers
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockState.mockFn;
}
```

Then in tests, call the setup function explicitly:

```typescript
it("test case", async () => {
  mockUseSlideManagerView(); // Explicit call
  setUseSlideManagerViewReturn(fakeState); // Then configure return value
  // ... test
});
```

**Benefits:**

- Tests are clearer: setup is explicit, not implicit
- Mocks are isolated per test (no cross-test pollution)
- Easy to verify mock was called correctly
- Easier to disable/modify mocking for specific tests

### 4. Preserve JSDoc

Always copy the JSDoc comments from the original file to the new file. Ensure parameters and return descriptions are accurate. Do not include types in JSDoc for TypeScript files.

### 5. Move and Refactor Tests

If the symbol being moved has existing tests, they must be moved to a new test file colocated with the source.

1. Create `NewFile.test.ts` next to `NewFile.ts`.
2. Move relevant `it`/`describe` blocks from the old test file to the new one.
3. Update imports in the new test file to point to the new location.
4. Update imports in the old test file if it still needs other symbols.
5. Remove the moved tests from the old test file.
6. Run the tests to ensure everything still passes.

### 6. Update References

Search the codebase for all occurrences of the moved symbol and update their imports.

- If switching from a named export in a multi-symbol file to a default export in a new file, change `import { symbol } from './Original'` to `import symbol from './New'`.
- When extracting test helpers: update all test files that import these helpers to use absolute paths (`@/react/event/manage/test-utils/mockUseSlideManagerView.test-util`). Also follow the convention of naming helper files with a `.test-util.ts[x]` suffix so their purpose is obvious.

## Step-by-Step Refactoring Process

1. **Identify the target**: Select the function or component to split off.
2. **Create the new file**: Create `NewFile.tsx` or `NewFile.ts` in the appropriate directory.
3. **Copy logic and JSDoc**: Transfer the code and its comments. Use `export default` if it's the only export.
4. **Locate tests**: Find the existing tests for the symbol (usually in `OriginalFile.test.ts`).
5. **Split tests**: Move the tests to `NewFile.test.ts`.
6. **Update imports**: Use `grep_search` or `semantic_search` to find all usages and update imports.
7. **Verify**: Run `npm run lint` and `npm run test:unit -- <NewFile>.test.ts` to confirm the change is correct.
