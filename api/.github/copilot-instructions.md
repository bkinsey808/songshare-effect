# GitHub Copilot Instructions

> **Note**: For comprehensive coding guidelines and project rules, see [`.agent/rules.md`](../.agent/rules.md).
> This file provides a quick reference for GitHub Copilot users.

## Project Overview

**SongShare Effect** is a React Vite project with Hono API server for Cloudflare Pages and Workers deployment.

### Architecture

- **Frontend**: React + Vite running on http://localhost:5173/
- **API**: Hono API server on Cloudflare Workers at http://localhost:8787/
- **Database**: Supabase with generated Effect schemas
- **Authentication**: Dual authentication system (visitor + user tokens) with JWT and Row Level Security (RLS)

See [`docs/authentication-system.md`](../docs/authentication-system.md) for complete authentication guide.

## Quick Reference

### File Organization

- ❌ **NO BARREL FILES**: Do not create `index.ts` files that re-export other modules
- ✅ **Direct Imports**: Always import directly from the source file
- ✅ **Docs filenames**: Use kebab-case for files under `docs/` directory

### React Standards

- ✅ **React Compiler Ready**: No manual memoization (`useCallback`, `useMemo`, `memo`)
- ✅ **TypeScript First**: Strong typing, avoid `any` types
- ❌ **No JSDoc types in `.ts`/`.tsx` files**: TypeScript should carry types natively

### Import Patterns

```typescript
// ✅ PREFERRED - Direct imports
import { NativePopover } from "./popover/NativePopover";
import { type PopoverProps } from "./popover/types";

// ❌ AVOID - Barrel file imports
import { NativePopover, PopoverProps } from "./popover";
```

### Testing Conventions

- ✅ **Vitest unit tests**: `*.test.ts` or `*.test.tsx` (colocated with source)
- ✅ **Playwright specs**: `*.spec.ts` or `*.spec.tsx` (in `e2e/` directory)

### Git Usage

- **Only humans run git**: Copilot will not run git commands that modify the repository
- **Read-only git commands are allowed**: `git status`, `git log`, `git diff`, etc.

### Configuration Files

- **Use ESM format**: `.js` or `.mjs` with `export`/`export default` (not `.cjs`)
- **Bun scripts**: Use `.bun.ts` extension for Bun TypeScript scripts

## Full Guidelines

For complete coding guidelines, architecture details, and best practices, see:

- [`.agent/rules.md`](../.agent/rules.md) - Complete coding guidelines and preferences
- [`README.md`](../README.md) - Project setup and development instructions
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Contribution guidelines
- [`docs/`](../docs/) - Additional documentation
