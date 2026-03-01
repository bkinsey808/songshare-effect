```skill
---
name: file-splitting
description: Comprehensive guide for breaking large files into separate single-function files. Covers naming, exports, import paths, test colocation, and validation. Use when refactoring consolidated utilities or test helpers into modular, maintainable pieces.
license: MIT
compatibility: TypeScript 5.x, React 18+, Vitest 1.x
metadata:
  author: bkinsey808
  version: "1.1"
---

# File Splitting Skill

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

### After: Separate Files

```
react/src/event/manage/test-utils/
├── mockReactRouter.test-util.ts
├── makeFakeManage.test-util.ts
├── makeFakeView.test-util.ts
├── makeFakeSelection.test-util.ts
├── makeSelectChangeEvent.test-util.ts
├── mockUseSlideManagerView.test-util.ts
└── setUseSlideManagerViewReturn.test-util.ts
```

For naming rules (camelCase utilities, PascalCase components, kebab-case multi-symbol), see [file-organization skill](../file-organization/SKILL.md).

## Step-by-Step Process

### Phase 1: Planning

#### 1. Analyze the Consolidated File

```bash
# Count exports
grep -c "^export" react/src/event/manage/test-utils.ts

# List each function
grep "^export function\|^export default" react/src/event/manage/test-utils.ts
```

#### 2. Identify Dependencies

For each function, note:

- **Imports** it requires (types, other utilities)
- **Dependencies** on other functions in the consolidated file
- **Test file** where tests currently exist

```typescript
// mockUseSlideManagerView()
// - Imports: vi, vi.doMock
// - Used by: setUseSlideManagerViewReturn (exports getMockFn)

// setUseSlideManagerViewReturn()
// - Imports: getMockFn from mockUseSlideManagerView
// - Depends on: mockUseSlideManagerView being set up first
```

#### 3. Choose Directory Structure

**Option A: New subdirectory for related helpers**

```
react/src/event/manage/test-utils/   ← New folder
├── mockReactRouter.test-util.ts
├── mockUseSlideManagerView.test-util.ts
└── ...
```

**Option B: Scatter into existing folders** — place near consumers when utilities serve different domains.

Use Option A for cohesive utilities; Option B for domain-specific helpers.

### Phase 2: Create Files

#### 4. Create Individual Files

For each function:

- **Copy JSDoc** — move the entire docblock with the logic; do not leave it behind
- **Default export** — `export default` the single symbol
- **No module-level side effects** (especially for test helpers)
- **No re-exports** — consumers import directly from the new path

After extraction, remove leftover comments from the original file. No `// implementation moved to …` annotations needed.

**Template for utility:**

```typescript
// react/src/event/manage/test-utils/makeFakeView.test-util.ts
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

**Template for callable mock (use `vi.hoisted` for state):**

```typescript
// react/src/event/manage/test-utils/mockUseSlideManagerView.test-util.ts
import { vi } from "vitest";

const mockState = vi.hoisted(
  () => ({ mockFn: undefined as ReturnType<typeof vi.fn> | undefined }),
);

/**
 * Set up the mock for useSlideManagerView.
 * @returns The mock function for inspection
 */
export default function mockUseSlideManagerView(): ReturnType<typeof vi.fn> {
  vi.resetModules();
  mockState.mockFn = vi.fn();
  vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({
    default: mockState.mockFn,
  }));
  return mockState.mockFn;
}

/** @returns The mock function if set up */
export function getMockFn(): ReturnType<typeof vi.fn> | undefined {
  return mockState.mockFn;
}
```

For more mocking patterns, see [unit-testing-mocking skill](../unit-testing-mocking/SKILL.md).

#### 5. Use Absolute Imports

```typescript
// ❌ BAD: Relative path fails if caller's depth changes
vi.doMock("../slide/useSlideManagerView", () => ({ ... }));

// ✅ GOOD: Absolute path works from any location
vi.doMock("@/react/event/manage/slide/useSlideManagerView", () => ({ ... }));
```

Path aliases: `@/api/` = `api/src/`, `@/shared/` = `shared/src/`, `@/react/` = `react/src/`

### Phase 3: Update Tests

#### 6. Extract Tests for Each Function

Create a test file next to each new source file:

```typescript
// mockUseSlideManagerView.test-util.test.ts
import { describe, expect, it } from "vitest";
import mockUseSlideManagerView from "./mockUseSlideManagerView.test-util";

describe("mockUseSlideManagerView", () => {
  it("returns a mock function", () => {
    const mockFn = mockUseSlideManagerView();
    expect(mockFn).toBeDefined();
  });
});
```

After migrating all tests, delete the old consolidated test file.

#### 7. Update All Consumer Imports

```bash
# Find all files importing from the old consolidated file
grep -r "from.*test-utils['\"]" react/src/event/manage/
```

```typescript
// Before
import { mockUseSlideManagerView, makeFakeView } from "@/react/event/manage/test-utils";

// After
import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";
import makeFakeView from "@/react/event/manage/test-utils/makeFakeView.test-util";
```

### Phase 4: Validation

```bash
npm run lint          # Check code style
npm run format        # Auto-format

# Test specific module
npm run test:unit -- react/src/event/manage/test-utils/

# Full suite
npm run test:unit
```

## Troubleshooting

### Tests still import from old consolidated file

Search and update:

```bash
grep -r "from.*test-utils['\"]" react/src/event/manage/
```

### Mock isn't being applied

- Call mock setup **before** importing the component under test
- Ensure `vi.resetModules()` is inside the mock setup function
- Verify mocked path exactly matches the actual import path

```typescript
it("test case", async () => {
  mockUseSlideManagerView(); // Must come first
  const { result } = renderHook(() => useSlideManagerView());
});
```

### Circular dependencies between helpers

Use getter functions instead of direct variable access:

```typescript
// mockUseSlideManagerView.test-util.ts (state owner)
export function getMockFn() { return mockState.mockFn; }

// setUseSlideManagerViewReturn.test-util.ts (consumer)
import { getMockFn } from "./mockUseSlideManagerView.test-util";
```

## Validation Checklist

- [ ] Each file contains one main exported symbol
- [ ] Files use `export default`
- [ ] Imports use absolute paths (`@/react/...`)
- [ ] JSDoc moved with the function (no types in JSDoc for `.ts` files)
- [ ] Test file created for each extracted function
- [ ] All consumer imports updated to new locations
- [ ] Old consolidated file deleted (if fully migrated)
- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes

## See Also

- [**source-refactoring skill**](../source-refactoring/SKILL.md) — General refactoring patterns
- [**file-organization skill**](../file-organization/SKILL.md) — Naming conventions, directory structure
- [**unit-testing-mocking skill**](../unit-testing-mocking/SKILL.md) — `vi.mock`, `vi.hoisted`, callable mock helpers
- [**unit-testing skill**](../unit-testing/SKILL.md) — Core test patterns
```
