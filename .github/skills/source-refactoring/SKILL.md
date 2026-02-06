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

### 2. Preserve JSDoc

Always copy the JSDoc comments from the original file to the new file. Ensure parameters and return descriptions are accurate. Do not include types in JSDoc for TypeScript files.

### 3. Move and Refactor Tests

If the symbol being moved has existing tests, they must be moved to a new test file colocated with the source.

1. Create `NewFile.test.ts` next to `NewFile.ts`.
2. Move relevant `it`/`describe` blocks from the old test file to the new one.
3. Update imports in the new test file to point to the new location.
4. Update imports in the old test file if it still needs other symbols.
5. Remove the moved tests from the old test file.
6. Run the tests to ensure everything still passes.

### 4. Update References

Search the codebase for all occurrences of the moved symbol and update their imports.

- If switching from a named export in a multi-symbol file to a default export in a new file, change `import { symbol } from './Original'` to `import symbol from './New'`.

## Step-by-Step Refactoring Process

1. **Identify the target**: Select the function or component to split off.
2. **Create the new file**: Create `NewFile.tsx` or `NewFile.ts` in the appropriate directory.
3. **Copy logic and JSDoc**: Transfer the code and its comments. Use `export default` if it's the only export.
4. **Locate tests**: Find the existing tests for the symbol (usually in `OriginalFile.test.ts`).
5. **Split tests**: Move the tests to `NewFile.test.ts`.
6. **Update imports**: Use `grep_search` or `semantic_search` to find all usages and update imports.
7. **Verify**: Run `npm run lint` and `npm run test:unit -- <NewFile>.test.ts` to confirm the change is correct.
