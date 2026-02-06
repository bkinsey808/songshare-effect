---
name: file-organization
description: File organization, naming conventions, and import patterns (no barrel files, direct imports, kebab-case docs, ESM config). Use when creating new files, modules, refactoring imports, or setting up directory structures.
license: MIT
compatibility: Node.js 20+, TypeScript 5.x, ESM modules
metadata:
  author: bkinsey808
  version: "1.0"
---

# File Organization Skill

## What This Skill Does

Establishes consistent file organization, naming conventions, and import patterns across the SongShare project:

- **No barrel files** - No `index.ts` re-export aggregators
- **Direct imports** - Always import from the source file directly
- **Descriptive filenames** - Clear module names that indicate purpose
- **Kebab-case docs** - Documentation files use kebab-case naming
- **ESM modules** - All config files use ESM format (`.js`, `.mjs`)
- **Colocated tests** - Unit tests live next to source files
- **Type clarity** - Explicit type imports, no `import type` shorthand abuse

## When to Use

- Creating new components, utilities, or modules
- Organizing directories or restructuring code
- Setting up config files (vite, tsconfig, eslint, etc.)
- Fixing problematic import statements
- Reviewing pull requests for import/organization issues
- Adding test files to the project

## Key Rules

### 1. No Barrel Files

❌ **Never create index.ts re-export files:**

```typescript
// BAD: .github/skills/typescript-conventions/index.ts
export { Convention1 } from "./Convention1";
export { Convention2 } from "./Convention2";
export { default as Helper } from "./helper";
```

✅ **Always import directly from source:**

```typescript
// GOOD: Import from source file
import { Convention1 } from "./Convention1";
import { Convention2 } from "./Convention2";
import Helper from "./helper";
```

**Why:** Barrel files hide the actual code structure, make tree-shaking harder, and add an extra indirection layer that complicates debugging.

### 2. Direct Imports Over Barrel Files

When you have a module with related exports, import directly:

```typescript
// ❌ BAD: Relying on barrel file
import { NativePopover, calculatePosition, PopoverProps } from "./popover";

// ✅ GOOD: Direct imports from source files
import { NativePopover } from "./popover/NativePopover";
import { calculatePosition } from "./popover/calculatePopoverPosition";
import { type PopoverProps } from "./popover/types";
```

### 3. Explicit Type Imports

Use `import type` when importing **only types**. Use inline `type` keyword when importing mixed types and values:

```typescript
// ✅ PREFERRED: All types - use import type
import type { PopoverProps, PopoverState } from "./popover/types";

// ✅ PREFERRED: Mixed imports - type keyword on individual types
import { NativePopover } from "./popover/NativePopover";
import { type PopoverProps } from "./popover/types";

// ❌ AVOID: Inline type when all imports are types
import { type PopoverProps, type PopoverState } from "./popover/types";
```

**Why:** Cleaner when all imports are types (no need for inline keyword), but explicit when mixing types and values.

### 4. Naming Conventions

#### Files

- **Single-symbol files** (preferred):
  - **PascalCase** for React components: `UserProfile.tsx`, `SongCard.tsx`
  - **camelCase** for utilities and functions: `formatDate.ts`, `calculateDuration.ts`
- **Multi-symbol files**: Use **kebab-case**: `auth-utils.ts`, `api-helpers.ts`
- **Directories**: Use **kebab-case** when grouping: `song-library/`, `auth-flow/`

#### Tests

- **Colocate with source** (same directory)
- **Name pattern:** `[SourceName].test.ts` or `[SourceName].test.tsx`
- Examples:
  - `src/utils/formatDate.ts` → `src/utils/formatDate.test.ts`
  - `react/src/components/SongCard.tsx` → `react/src/components/SongCard.test.tsx`
  - `e2e/flows/login.spec.ts` (Playwright uses `.spec.ts`)

#### Documentation

- **kebab-case** for all docs: `authentication-system.md`, `effect-implementation.md`, `commit-message-instructions.md`
- Not: `authenticationSystem.md` or `AuthenticationSystem.md`

#### Configuration Files

- **Preserve original convention** but use ESM: `vite.config.js`, `tsconfig.json`, `tailwind.config.js`
- If creating new: use `.js` with ESM export, not `.cjs`
- Examples:

  ```javascript
  // ✅ GOOD: vite.config.js (ESM)
  export default { /* ... */ };

  // ❌ BAD: vite.config.cjs (CommonJS)
  module.exports = { /* ... */ };
  ```

#### Bun Scripts

- Use `.bun.ts` extension for scripts run under Bun
- Example: `scripts/postinstall-playwright.bun.ts`
- Fallback to `.mjs` if `.bun.ts` not supported

### 5. Project Structure

```
songshare-effect/
├── .agent/                    # Custom agent rules
│   └── rules.md              # Canonical coding guidelines
├── .github/
│   ├── skills/               # Agent Skills (portable)
│   │   ├── effect-ts-patterns/
│   │   ├── authentication-system/
│   │   └── file-organization/
│   └── agents/               # Custom agents (VS Code specific)
├── api/
│   └── src/
│       ├── errors.ts         # Type definitions (no index.ts)
│       ├── schemas.ts
│       ├── services.ts
│       ├── server.ts
│       └── supabase/         # Grouped by feature
│           ├── getSupabaseClientToken.ts
│           └── types.ts
├── react/
│   └── src/
│       ├── components/       # One component per file
│       │   ├── SongCard.tsx
│       │   ├── SongCard.test.tsx
│       │   └── UserMenu.tsx
│       ├── hooks/            # Custom hooks
│       │   ├── useSongLibrary.ts
│       │   └── useSongLibrary.test.ts
│       └── auth/             # Feature grouping
│           ├── auth-slice.ts
│           └── auth-slice.test.ts
├── shared/
│   └── src/
│       ├── types/            # Type definitions
│       │   └── song.ts
│       └── utils/            # Utilities
│           ├── formatDuration.ts
│           └── formatDuration.test.ts
├── docs/                     # Documentation (kebab-case)
│   ├── authentication-system.md
│   ├── effect-implementation.md
│   └── commit-message-instructions.md
└── scripts/
    ├── build/
    │   └── generate-effect-schemas/
    │       ├── index.ts
    │       └── helpers/
    │           ├── toPascalCase.ts
    │           └── toPascalCase.test.ts
    └── dev/
```

**Rules:**

- ✅ Feature/domain directories group related files (`auth/`, `supabase/`, `song-library/`)
- ✅ One main export per file; utilities can be grouped by domain
- ✅ Test files colocated with source
- ❌ No `index.ts` re-export files anywhere
- ❌ No deeply nested structures (max 3-4 levels)

### 6. Import Organization

Within a file, organize imports in this order:

```typescript
// 1. External packages
import React from "react";
import { Effect } from "effect";
import { createClient } from "@supabase/supabase-js";

// 2. Internal absolute imports (if configured)
import { Song, SongError } from "@shared/types/song";

// 3. Internal relative imports (features/utilities)
import { SongCard } from "../components/SongCard";
import { useSongLibrary } from "../hooks/useSongLibrary";
import { type SongLibraryProps } from "./types";

// 4. Type-only imports last
import type { Metadata } from "@shared/types/metadata";
```

## Common Pitfalls

### ❌ Creating index.ts to re-export

```typescript
// BAD: songshare-effect/react/src/components/index.ts
export { SongCard } from "./SongCard";
export { UserProfile } from "./UserProfile";
export { SongLibrary } from "./SongLibrary";
```

**✅ Better:** Delete the file and import directly from components:

```typescript
import { SongCard } from "./components/SongCard";
import { UserProfile } from "./components/UserProfile";
```

### ❌ Mixing camelCase and PascalCase inconsistently

```typescript
// BAD: Inconsistent naming
const UserProfile.tsx         // Component: PascalCase ✓
const songHelper.ts           // Utility: camelCase ✓
const AuthenticationHelper.ts  // Utility: PascalCase ✗ (should be camelCase)
const user-profile-card.tsx   // Component: kebab-case ✗ (should be PascalCase)
```

### ❌ Storing tests in separate test directory

```typescript
// BAD: test/ directory separate from source
src/
  components/SongCard.tsx
tests/
  components/SongCard.test.tsx
```

**✅ Better:** Colocate tests with source:

```typescript
src/
  components/
    SongCard.tsx
    SongCard.test.tsx
```

### ❌ Using CommonJS in new config files

```javascript
// BAD: vite.config.cjs (CommonJS)
module.exports = {
  /* ... */
};
```

**✅ Better:** Use ESM:

```javascript
// GOOD: vite.config.js (ESM)
export default {
  /* ... */
};
```

## Deep Reference

For detailed technical reference on import organization patterns, comprehensive naming conventions, project structure templates, and step-by-step refactoring guides, see [the reference guide](references/REFERENCE.md).

## Refactoring Imports

To fix an existing file that imports from barrel files:

1. **Find the barrel file:**

   ```typescript
   // Bad: importing from popover/index.ts
   import { NativePopover } from "./popover";
   ```

2. **Locate actual source files:**

   ```
   popover/
     ├── NativePopover.tsx       ← Source
     ├── calculatePosition.ts    ← Source
     └── types.ts               ← Source
   ```

3. **Replace with direct imports:**
   ```typescript
   // Good: importing from source files
   import { NativePopover } from "./popover/NativePopover";
   import { calculatePosition } from "./popover/calculatePosition";
   import { type PopoverProps } from "./popover/types";
   ```

## Validation Commands

```bash
# Find all index.ts files (should only be in skip-list)
find . -name "index.ts" -not -path "./node_modules/*" -not -path "./.next/*"

# Check for common.js files (should use .js with ESM)
find . -name "*.cjs" -not -path "./node_modules/*"

# Lint imports
npm run lint
```

## References

- Reference guide: [references/REFERENCE.md](references/REFERENCE.md) - Detailed patterns and examples
- Project rules: [.agent/rules.md](../../../.agent/rules.md)
- Copilot instructions: [.github/copilot-instructions.md](../../../.github/copilot-instructions.md)
- TypeScript conventions skill: [../typescript-conventions/SKILL.md](../typescript-conventions/SKILL.md)
