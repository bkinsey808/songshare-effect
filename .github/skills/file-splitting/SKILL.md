---
name: file-splitting
description: Comprehensive guide for breaking large files into separate single-function files. Covers naming, exports, import paths, test colocation, and validation. Use when refactoring consolidated utilities or test helpers into modular, maintainable pieces.
license: MIT
compatibility: TypeScript 5.x, React 18+, Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.0"
---

# File Splitting Skill

## What This Skill Does

Provides step-by-step guidance for breaking a large consolidated file into multiple single-function files while maintaining testability, consistency, and path independence.

Covers:

- **Single responsibility** – One function per file
- **Naming conventions** – camelCase for functions, PascalCase for components
- **Export patterns** – Default exports for single symbols
- **Import paths** – Absolute paths for portability
- **Test colocation** – Tests grouped with their source files
- **Validation** – Linting, typing, and test verification

## When to Use

- When a file contains multiple independent functions or utilities
- When refactoring consolidated unit test helpers (e.g., `test-utils.ts` or `*.test-utils.ts`) into individually named `*.test-util.ts` files
- When extracting logic from a large component into individual hooks
- When utilities grow large enough to warrant splitting

## Anatomy: Before and After

### Before: Consolidated File

```typescript
// react/src/event/manage/test-utils.ts (7 functions)
export function mockReactRouter() { ... }
export function makeFakeManage() { ... }
export function makeFakeView() { ... }
export function makeFakeSelection() { ... }
export function makeSelectChangeEvent() { ... }
export function mockUseSlideManagerView() { ... }
export function setUseSlideManagerViewReturn() { ... }
```

**Problems:**

- All functions load when any one is imported
- Hard to test individual utilities
- Mixed concerns (mocking, object factories)
- No explicit test files per function
- Difficult to trace dependencies

### After: Separate Files

```
react/src/event/manage/test-utils/
├── mockReactRouter.ts
├── makeFakeManage.ts
├── makeFakeView.ts
├── makeFakeSelection.ts
├── makeSelectChangeEvent.ts
├── mockUseSlideManagerView.ts
├── setUseSlideManagerViewReturn.ts
```

**Benefits:**

- ✅ Single responsibility per file
- ✅ Can import only what's needed
- ✅ Each function has a dedicated test file
- ✅ Clear, focused concerns
- ✅ Easier to trace dependencies

## Step-by-Step Process

### Phase 1: Planning

#### 1. Analyze the Consolidated File

```bash
# Count functions/exports
grep -c "^export" react/src/event/manage/test-utils.ts
# note: the consolidated file uses plural "test-utils" but our new convention uses singular "test-util" after splitting

# List each function
grep "^export function\|^export default" react/src/event/manage/test-utils.ts
```

#### 2. Identify Dependencies

For each function, note:

- **Imports** it requires (types, other utilities)
- **Dependencies** on other functions in the consolidated file
- **Test file** where tests currently exist

Example dependency map:

```typescript
// mockUseSlideManagerView()
// - Imports: vi, vi.doMock
// - Used by: setUseSlideManagerViewReturn (exports getMockFn)
// - Tests: SlideManagerView.test.tsx

// setUseSlideManagerViewReturn()
// - Imports: getMockFn from mockUseSlideManagerView
// - Depends on: mockUseSlideManagerView being set up first
// - Tests: useSlideManagerView.test.tsx
```

#### 3. Choose Directory Structure

Decide where to place the split files:

**Option A: New subdirectory for related helpers**

```
react/src/event/manage/test-utils/  ← New folder
├── mockReactRouter.ts
├── mockUseSlideManagerView.ts
├── setUseSlideManagerViewReturn.ts
├── makeFakeManage.ts
└── ...
```

**Option B: Scatter into existing folders**

If utilities serve different domains, place them near consumers:

```
react/src/event/manage/slide/
├── useSlideManagerView.ts
├── useSlideManagerView.test.ts
├── mockUseSlideManagerView.ts        ← Co-located with hook
└── setUseSlideManagerViewReturn.ts
```

**Recommendation:** Use Option A (subdirectory) for cohesive utilities with shared concerns; Option B for domain-specific helpers.

### Phase 2: Create Files

#### 4. Create Individual Files

For each function, create a new file with:

- **Proper imports** (from consolidated or external)
- **JSDoc comments** – copy the entire comment block that documents the symbol being moved. The documentation is part of the implementation; do not leave it behind in the source file or replace it with a vague reference. Missing this step is a common source of confusion for AI assistants, so be explicit: _when you move logic, move its JSDoc too._
- **Default export** – every isolated file should `export default` its single symbol rather than a named export.
- **No module-level side effects** (especially for test helpers—see below)

**Avoid re-exports**. This repository shuns barrel files and module re-exports; each consumer imports the helper or type directly from its own path. If you extract a type or function, don't re-export it from another module just for convenience.

After extraction, go back to the original file and remove any leftover comments or docblocks relating to the moved logic. There’s no need to leave `// implementation moved to …` or similar annotations; the handler should stand alone with only its own documentation.

**Template for utility:**

```typescript
// react/src/event/manage/test-utils/makeFakeView.ts
import type { UseEventView } from "@/react/event/manage/slide/useSlideManagerView";

/**
 * Create a fake return value for the useEventView hook.
 * @param overrides - Optional overrides for specific properties
 * @returns A fake view state object
 */
export default function makeFakeView(overrides?: Partial<UseEventView>): UseEventView {
  return {
    activeSlidePosition: 2,
    activeSongTotalSlides: 5,
    ...overrides,
  };
}
```

**Template for test helper (callable function, no side effects):**

```typescript
// react/src/event/manage/test-utils/mockUseSlideManagerView.ts
import { vi } from "vitest";

const mockState = vi.hoisted(
  () =>
    ({
      mockFn: undefined as ReturnType<typeof vi.fn> | undefined,
    }),
);

/**
 * Set up the mock for useSlideManagerView. Must be called explicitly in each test.
 * @returns The mock function for inspection
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules(); // Clear cache for fresh setup
  mockState.mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockState.mockFn,
  }));
  return mockState.mockFn;
}

/**
 * Get the current mock function (used by setters).
 * @returns The mock function if set up
 */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockState.mockFn;
}
```

**Note:** Use `vi.hoisted()` instead of raw `let` declarations for test helper state. It's the idiomatic Vitest pattern for creating test-scoped state without exposing module-level variables.

#### 5. Use Absolute Imports

**Why:** Files imported from multiple locations at varying depths need stable paths.

```typescript
// ❌ BAD: Relative path fails if caller's depth changes
vi.doMock("../slide/useSlideManagerView", () => ({ ... }));

// ✅ GOOD: Absolute path works from any location
vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({ ... }));
```

Add to `tsconfig.base.json` if needed:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Phase 3: Update Tests

#### 6. Extract Tests for Each Function

From the consolidated test file, move tests to individual files:

```bash
# Before: react/src/event/manage/test-utils.test.ts
describe("test-utils", () => {
  describe("mockUseSlideManagerView", () => { it(...) {} })
  describe("setUseSlideManagerViewReturn", () => { it(...) {} })
  describe("makeFakeManage", () => { it(...) {} })
  ...
})

# After: Created separate test files
react/src/event/manage/test-utils/
├── mockUseSlideManagerView.test.ts
├── setUseSlideManagerViewReturn.test.ts
├── makeFakeManage.test.ts
...
```

**Steps:**

1. **Create test file next to source:**

   ```bash
   # For each function
   touch react/src/event/manage/test-utils/mockUseSlideManagerView.test-util.ts
   ```

2. **Move relevant tests:**

   ```typescript
   // mockUseSlideManagerView.test.ts
   import { describe, expect, it } from "vitest";
   import mockUseSlideManagerView from "./mockUseSlideManagerView";

   describe("mockUseSlideManagerView", () => {
     it("returns a mock function", () => {
       const mockFn = mockUseSlideManagerView();
       expect(mockFn).toBeDefined();
     });
   });
   ```

3. **Update imports in test files:**

   ```typescript
   // Before: import { mockUseSlideManagerView } from "./test-utils";
   // After splitting, helper would be imported from `mockUseSlideManagerView.test-util`
   // After:
   import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";
   ```

4. **Delete the old consolidated test file** after migration:
   ```bash
   rm react/src/event/manage/test-utils.test.ts
   ```

#### 7. Update All Consumer Tests

Search for all test files importing from the consolidated file and update:

```typescript
// Before: SlideManagerView.test.tsx
import {
  mockReactRouter,
  mockUseSlideManagerView,
  setUseSlideManagerViewReturn,
  makeFakeView,
} from "@/react/event/manage/test-utils";

// After:
import mockReactRouter from "@/react/event/manage/test-utils/mockReactRouter.test-util";
import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";
import setUseSlideManagerViewReturn from "@/react/event/manage/test-utils/setUseSlideManagerViewReturn.test-util";
import makeFakeView from "@/react/event/manage/test-utils/makeFakeView.test-util";
```

### Phase 4: Validation

#### 8. Run Linting and Formatting

```bash
npm run lint         # Check code style
npm run format       # Auto-format files
```

Fix any issues reported (unused imports, naming, etc.).

#### 9. Run Tests

```bash
# Test the specific module
npm run test:unit -- react/src/event/manage/test-utils/mockUseSlideManagerView.test-util.ts

# Test all event-manage files
npm run test:unit -- react/src/event/manage/

# Full suite (to catch breaking changes)
npm run test:unit
```

Ensure all tests pass before committing.

#### 10. Verify Path Independence (for shared helpers)

If helpers are used from multiple test locations, verify they work from different directory depths:

```bash
# From directory: react/src/event/manage/
npm run test:unit -- slide/SlideManagerView.test.tsx
npm run test:unit -- useSlideManagerView.test.tsx

# From root:
npm run test:unit -- react/src/event/manage/slide/SlideManagerView.test.tsx
```

If all tests pass with absolute imports, path independence is confirmed.

## Naming Conventions

### Single-Symbol Files

| Type             | Pattern                    | Example                              |
| ---------------- | -------------------------- | ------------------------------------ |
| Utility function | camelCase                  | `makeFakeManage.ts`, `formatDate.ts` |
| React component  | PascalCase                 | `SongCard.tsx`, `EventCard.tsx`      |
| Mock function    | camelCase                  | `mockUseSlideManagerView.ts`         |
| Type definitions | kebab-case (if multi-type) | `types.ts`, `event-types.ts`         |

### Multi-Symbol Files

Use kebab-case for files with multiple unrelated exports:

```typescript
// ✅ Multi-symbol file: kebab-case
// react/src/event/auth-utils.ts
export function parseJWT() { ... }
export function refreshToken() { ... }
export function isTokenExpired() { ... }
```

## Common Patterns

### Pattern 1: Factory Functions

Create objects with optional overrides:

```typescript
// makeFakeView.ts
export default function makeFakeView(
  overrides?: Partial<UseEventView>,
): UseEventView {
  return {
    activeSlidePosition: 2,
    activeSongTotalSlides: 5,
    ...overrides,
  };
}

// Test usage
const fakeView = makeFakeView({ activeSlidePosition: 10 });
```

### Pattern 2: Callable Mock Setup

For vitest mocks that must be set up explicitly:

```typescript
// mockUseSlideManagerView.ts
let mockFn: ReturnType<typeof vi.fn> | undefined = undefined;

export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules();
  mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockFn,
  }));
  return mockFn;
}

export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockFn;
}

// Test usage
it("test case", () => {
  mockUseSlideManagerView(); // Explicit call
  // ... assertions
});
```

### Pattern 3: Event/Object Builders

Create DOM events or objects with proper typing:

```typescript
// makeSelectChangeEvent.ts
import type { ChangeEvent } from "react";

/**
 * Create a fake select change event for testing.
 * @param value - The selected value
 * @returns A properly typed ChangeEvent
 */
export default function makeSelectChangeEvent(
  value: string,
): ChangeEvent<HTMLSelectElement> {
  return { target: { value } } as ChangeEvent<HTMLSelectElement>;
}

// Test usage
const event = makeSelectChangeEvent("song-id");
handleSelectChange(event);
```

## Troubleshooting

### Issue: Tests still import from old consolidated file

**Solution:**

1. Search for imports from the old file:
   ```bash
   grep -r "from.*test-utils['\"]" react/src/event/manage/
   ```
2. Update each import to use absolute paths:
   ```typescript
   import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView";
   ```

### Issue: Mock isn't being applied to tests

**Solution:**

- Ensure `vi.resetModules()` is called in the mock setup function
- Verify the mock setup is called **before** importing the component under test
- Check that the mocked path matches the actual import path exactly (use absolute paths)

```typescript
it("test case", async () => {
  mockUseSlideManagerView(); // Must come first
  const { result } = renderHook(() => useSlideManagerView());
  // ...
});
```

### Issue: Circular dependencies between helpers

**Solution:**

- Use getter functions (like `getMockFn()`) instead of direct variable access
- Keep one module as the "owner" of shared state
- Other modules import and use exported getters

```typescript
// mockUseSlideManagerView.ts (owner of mock state)
let mockFn: ReturnType<typeof vi.fn> | undefined = undefined;
export function getMockFn() { return mockFn; }

// setUseSlideManagerViewReturn.ts (consumer)
import { getMockFn } from "./mockUseSlideManagerView";
// Use getMockFn() instead of importing mockFn directly
```

## Validation Checklist

- [ ] Each file contains one main exported symbol
- [ ] Files use default exports (`export default`)
- [ ] Imports use absolute paths (`@/react/...`)
- [ ] Every function has JSDoc (no types in JSDoc for TS files)
- [ ] Test file created for each extracted function
- [ ] All consumer imports updated to new locations
- [ ] Old consolidated file deleted (if fully migrated)
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] `npm run test:unit` passes (all tests green)
- [ ] For helpers: verified they work from multiple import locations

## See Also

- [**source-refactoring skill**](../source-refactoring/SKILL.md) — General refactoring patterns and best practices
- [**file-organization skill**](../file-organization/SKILL.md) — Naming conventions, import organization, directory structure
- [**unit-testing skill**](../unit-testing/SKILL.md) — Test helper patterns, callable setup functions, vitest best practices
- [**typescript-conventions skill**](../typescript-conventions/SKILL.md) — Typing strictness, JSDoc, no `any` types
