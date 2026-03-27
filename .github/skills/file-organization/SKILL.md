---
name: file-organization
description: File organization, naming conventions, and import patterns (no barrel files, direct imports, kebab-case docs, ESM config). Use when creating new files, modules, refactoring imports, or setting up directory structures.
---

**Requires:** file-read, terminal (linting/testing). No network access needed.

# File Organization Skill

## Use When

Use this skill when:

- Creating new files/directories or restructuring module layout.
- Updating imports/exports to comply with repo organization rules.

Execution workflow:

1. Follow naming and placement conventions for file type and symbol type.
2. Avoid barrel files and use direct imports.
3. Keep test/docs naming conventions aligned with project rules.
4. Validate with `npm run lint` after meaningful structure/import changes.

Output requirements:

- Summarize structural and import-path changes.
- Note any convention exception that remains and why.

## Key Rules

### 1. No Barrel Files — Always Import Directly

❌ **Never create `index.ts` re-export files:**

```typescript
// BAD: react/src/components/index.ts
export { SongCard } from "./SongCard";
export { UserProfile } from "./UserProfile";
```

✅ **Always import directly from source:**

```typescript
// GOOD
import { SongCard } from "./components/SongCard";
import { UserProfile } from "./components/UserProfile";
```

This applies everywhere: no `export { something } from "./somefile"` re-exports.

### 2. Explicit Type Imports

```typescript
// ✅ All types — use import type
import type { PopoverProps, PopoverState } from "./popover/types";

// ✅ Mixed imports — type keyword on individual types
import { NativePopover } from "./popover/NativePopover";
import { type PopoverProps } from "./popover/types";

// ❌ Avoid inline type when all imports are types
import { type PopoverProps, type PopoverState } from "./popover/types";
```

### 3. Naming Conventions

#### Files

- **Single-symbol files** (preferred):
  - **PascalCase** for React components: `UserProfile.tsx`, `SongCard.tsx`
  - **camelCase** for utilities and functions: `formatDate.ts`, `calculateDuration.ts`
- **Multi-symbol files**: **kebab-case**: `auth-utils.ts`, `api-helpers.ts`
- **Test-only helpers**: `.test-util.ts` / `.test-util.tsx` suffix (e.g. `mockUseSlideManagerView.test-util.ts`)
- **Directories**: **kebab-case**: `song-library/`, `auth-flow/`

#### Tests

- **Colocate with source** (same directory)
- **Name pattern:** `[SourceName].test.ts` or `[SourceName].test.tsx`
- Playwright E2E specs use `.spec.ts` under `e2e/`

#### Documentation

- **kebab-case** for all docs in `docs/`: `authentication-system.md`, `effect-implementation.md`

#### Configuration Files

- ESM only — use `.js` with `export default`, not `.cjs`
- `vite.config.js`, `tsconfig.json`, `tailwind.config.js` — preserve original names

#### Bun Scripts

- Use `.bun.ts` extension for scripts run under Bun: `scripts/postinstall-playwright.bun.ts`

### 4. Project Structure

```
songshare-effect/
├── api/
│   └── src/
│       ├── api-errors.ts         # Shared error types
│       ├── env.ts
│       ├── hono/                 # Hono context utilities
│       ├── supabase/             # Supabase client helpers
│       │   ├── getSupabaseClientToken.ts
│       │   └── tokenCache.ts
│       └── <feature>/           # Feature dirs (community, event, auth, …)
├── react/
│   └── src/
│       ├── auth/
│       │   ├── slice/            # Auth state (createAuthSlice.ts)
│       │   └── SignInButtons.tsx
│       ├── lib/                  # Shared React utilities
│       │   └── supabase/        # Supabase client + token helpers
│       └── <feature>/           # Feature dirs with colocated tests
├── shared/
│   └── src/
│       ├── generated/           # DB schema + types (auto-generated)
│       └── <domain>/            # Shared types/utils per domain
├── docs/                        # kebab-case .md files
└── scripts/
```

**Rules:**

- ✅ Feature/domain directories group related files
- ✅ One main export per file; utilities grouped by domain
- ✅ Test files colocated with source
- ❌ No `index.ts` re-export files anywhere
- ❌ No deeply nested structures (max 3–4 levels)

### 5. Absolute Paths for Cross-Module Imports

Use absolute paths (`@/`) for test helpers or utilities imported from **multiple different locations**:

```typescript
// ✅ GOOD: Same absolute path from any caller
import mockUseSlideManagerView from "@/react/event/manage/test-utils/mockUseSlideManagerView.test-util";

// ❌ BAD: Relative paths break when caller depth changes
import mockUseSlideManagerView from "./test-utils/mockUseSlideManagerView.test-util";
```

Path aliases: `@/api/` = `api/src/`, `@/shared/` = `shared/src/`, `@/react/` = `react/src/`

### 6. Import Order Within a File

```typescript
// 1. External packages
import React from "react";
import { Effect } from "effect";

// 2. Internal absolute imports
import { AppError } from "@/api/api-errors";
import mockHelper from "@/react/event/manage/test-utils/mockHelper.test-util";

// 3. Internal relative imports
import { SongCard } from "../components/SongCard";
import { type SongLibraryProps } from "./types";

// 4. Type-only imports last
import type { Metadata } from "@/shared/types/metadata";
```

## Refactoring Imports

To fix a file that imports from barrel files:

1. **Find barrel import:** `import { NativePopover } from "./popover";`
2. **Locate actual source files** in `popover/` directory
3. **Replace with direct imports:**

```typescript
import { NativePopover } from "./popover/NativePopover";
import { calculatePosition } from "./popover/calculatePosition";
import { type PopoverProps } from "./popover/types";
```

## Validation Commands

```bash
# Find all index.ts files (should be absent)
find . -name "index.ts" -not -path "./node_modules/*"

# Check for CommonJS config files (should use .js with ESM)
find . -name "*.cjs" -not -path "./node_modules/*"

# Lint
npm run lint
```

## References

- Reference guide: [references/REFERENCE.md](/.github/skills/file-organization/references/REFERENCE.md)
- Project rules: [.agent/rules.md](/.agent/rules.md)
- TypeScript conventions: [../typescript-conventions/SKILL.md](/.github/skills/typescript-conventions/SKILL.md)
- Source refactoring: [../source-refactoring/SKILL.md](/.github/skills/source-refactoring/SKILL.md)

## Do Not

- Do not violate repo-wide rules in `.agent/rules.md`.
- Do not add broad lint/type suppressions without explicit justification.
- Do not expand scope beyond the requested task without calling it out.

## Success Criteria

- Changes follow this skill's conventions and project rules.
- Relevant validation commands are run, or skipped with a clear reason.
- Results clearly summarize behavior impact and remaining risks.

## Skill Handoffs

- If reorganizing includes splitting large modules, also load `file-splitting`.
- If symbol naming decisions are part of the reorg, also load `naming-conventions`.
