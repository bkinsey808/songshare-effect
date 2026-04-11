---
name: source-refactoring
description: Patterns for splitting functions and components into their own files. Ensures consistent exports, JSDoc preservation, and test colocation. Use when refactoring large files or extracting reusable logic.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# Source Refactoring Skill

## Use When

Use this skill when:

- Splitting large files into focused modules/components.
- Moving logic into new files while preserving behavior and tests.

Execution workflow:

1. Extract one coherent symbol/group at a time with minimal behavior change.
2. Keep exports/imports aligned with repo conventions and avoid barrel files.
3. Update colocated tests or add targeted tests for extracted logic.
4. Validate with targeted tests first, then `npm run lint`.

Output requirements:

- Summarize what was extracted/moved and where.
- Note any import-path or export-shape changes.

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

Test helper files should export **callable setup functions**, not auto-execute at import time. Use `vi.hoisted()` for shared mock state.

See [unit-test-best-practices skill](/skills/unit-test-best-practices/SKILL.md) for full mocking patterns and examples.

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

## Do Not

- Do not violate repo-wide rules in `docs/ai/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If the refactor is specifically file decomposition, also load `file-splitting`.
- If naming changes are central to the refactor, also load `naming-conventions`.
