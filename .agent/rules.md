# Antigravity Custom Rules for Songshare-Effect

This file defines custom coding guidelines and preferences for the Antigravity AI assistant when working on the songshare-effect project.

## 📋 Coding Guidelines & Preferences

### **File Organization**

- ❌ **NO BARREL FILES**: Do not create index.ts files that re-export other modules
- ✅ **Direct Imports**: Always import directly from the source file (e.g., `import { Component } from './Component'`)
- ✅ **Explicit Imports**: Prefer explicit named imports over default exports when possible
- ✅ **File Naming**: Use descriptive filenames that clearly indicate the module's purpose
- ✅ **Docs filenames**: Use kebab-case for files under the `docs/` directory (for example, `commit-message-instructions.md` not `commitMessageInstructions.md`)

### **React Development Standards**

- ✅ **React Compiler Ready**: No manual memoization (useCallback, useMemo, memo) - let React Compiler optimize
- ✅ **TypeScript First**: Strong typing with proper type definitions, avoid `any` types
- ✅ **Modern React**: Use hooks (useId, useRef, useState, useEffect) with proper dependency arrays
- ✅ **Component Organization**: One main component per file, co-locate related utilities

### **Import/Export Patterns**

```typescript
// ✅ PREFERRED - Direct imports
import { NativePopover } from "./popover/NativePopover";
import { calculatePosition } from "./popover/calculatePopoverPosition";
import { type PopoverProps } from "./popover/types";

// ❌ AVOID - Barrel file imports
import { NativePopover, calculatePosition, PopoverProps } from "./popover";

// ❌ AVOID - type imports
import type { PopoverProps } from "./popover/types";
```

### **Type Safety**

- ✅ **Proper typing**: Define types for component props and function parameters
- ✅ **Union types**: Use union types for constrained string values (e.g., `PlacementOption`)
- ✅ **Optional chaining**: Use `?.` for safe property access
- ❗ **JSDoc in TypeScript files:** Do **not** add type annotations in JSDoc for `*.ts` / `*.tsx` files — TypeScript should carry types natively. JSDoc-based types are acceptable in plain JavaScript files, but in this repository avoid duplicating or overriding real TypeScript types in comments.
- ❗ **ReactElement is ambient**: `ReactElement` is an ambient type in this project and does not need to be imported. Do not add `import type { ReactElement } from "react"` - it's available globally.

### **Performance & Optimization**

- ✅ **Native APIs**: Prefer browser-native APIs when available (e.g., Popover API)
- ✅ **RAF throttling**: Use requestAnimationFrame for smooth animations and scroll handling
- ✅ **Event cleanup**: Always clean up event listeners in useEffect returns
- ✅ **Efficient re-renders**: Trust React Compiler, avoid premature optimization

## 🧪 Test File Naming Conventions

- ✅ **Vitest unit tests**: Place unit tests next to the file they test and name them `*.test.ts` or `*.test.tsx`.
- ✅ **Playwright specs**: Reserve `*.spec.ts` / `*.spec.tsx` for Playwright end-to-end or integration tests; these should live in `e2e/` or a dedicated `tests/` folder.
- ✅ **Why**: Colocating unit tests keeps feedback fast and local to the implementation, while reserving `spec` filenames for Playwright avoids confusion between unit and E2E test runners.

**Examples:**

- `scripts/build/generate-effect-schemas/helpers/toPascalCase.ts`
- `scripts/build/generate-effect-schemas/helpers/toPascalCase.test.ts` (Vitest unit test)
- `e2e/flows/login.spec.ts` (Playwright spec)

## **Git Usage**

- **Only humans do git:** Antigravity will not run git commands that change the repository (for example: `git mv`, `git commit`, `git push`, `git checkout` that modifies branches, `git reset`, or any other write operations). Humans should perform those actions.
- **Read-only git commands are allowed:** Antigravity may run or suggest read-only git commands for inspection and diagnostics (for example: `git status`, `git grep`, `git log`, `git show`, `git diff` without applying patches). These commands are safe for gathering information.
- **Propose before changing:** When a change requires git actions, Antigravity will propose the exact commands and wait for a human to run them (or to approve/execute them manually).

## **Configuration File Formats**

- **Config file format:** This repository standardizes on ECMAScript modules (ESM) for JS configuration files. Use `.js` or `.mjs` with `export`/`export default` rather than `.cjs`/`module.exports`. Examples: `commitlint.config.js`, `vite.config.js`, etc. Do not add `.cjs` files.
- **Bun scripts:** When writing repository scripts intended to be run under Bun, prefer a Bun TypeScript script with the `.bun.ts` extension (for example `scripts/postinstall-playwright.bun.ts`). If `.bun.ts` cannot be used due to environment constraints, prefer `.mjs` in ESM format.

## **Project Architecture**

This is a React Vite project with Hono API server for Cloudflare Pages and Workers deployment.

### **Authentication System**

- Dual authentication system with visitor tokens (anonymous) and user tokens (authenticated) implemented
- JWT-based authentication with automatic token switching and Row Level Security (RLS) enforcement
- See `docs/authentication-system.md` for complete guide

### **Project Structure**

- **Frontend**: React + Vite running on http://localhost:5173/
- **API**: Hono API server on Cloudflare Workers at http://localhost:8787/
- **Database**: Supabase with generated Effect schemas
