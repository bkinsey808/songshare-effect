# Agent Rules — songshare-effect

Quick-reference coding guidelines. Follow skill links for detailed guidance.

## Core Rules

- **No barrel files**: import directly from the source file — never from an `index.ts` re-export.
- **One symbol per file**: name the file after the symbol (`camelCase.ts` for functions, `PascalCase.tsx` for components). Multi-symbol files use `kebab-case.ts`. Docs use `kebab-case.md`.
- **ESM config files**: use `.js` / `.mjs` with `export default`. Never `.cjs` / `module.exports`.
- **Bun scripts**: use the `.bun.ts` extension (e.g. `scripts/postinstall-playwright.bun.ts`).
- **ReactElement is ambient**: do not import it from `react` — it is available globally.
- **JSDoc in TypeScript**: never include type annotations in JSDoc for `.ts` / `.tsx` — TypeScript provides the types. OK in plain `.js` files only.
- **No lint disables in test files**: do not add `oxlint-disable` or `eslint-disable` in `*.test.ts` / `*.test.tsx`. Fix the code, or extract helpers into `*.test-util.*` files.
- **Strict TypeScript**: project uses `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`. See [docs/strict-typescript-patterns.md](/docs/strict-typescript-patterns.md).

## Skills (load for detailed guidance)

- [**file-organization**](/.github/skills/file-organization/SKILL.md) — no barrel files, direct imports, naming conventions
- [**source-refactoring**](/.github/skills/source-refactoring/SKILL.md) — splitting files, default exports, test colocation, updating imports
- [**typescript-conventions**](/.github/skills/typescript-conventions/SKILL.md) — strict typing, no `any`, JSDoc rules
- [**react-conventions**](/.github/skills/react-conventions/SKILL.md) — React Compiler (no manual memoization), hooks, component organization
- [**lint-error-resolution**](/.github/skills/lint-error-resolution/SKILL.md) — fix root causes; never suppress broadly
- [**unit-test-best-practices**](/.github/skills/unit-test-best-practices/SKILL.md) — Vitest setup, mocking patterns, API handler tests, common pitfalls
- [**unit-test-hook-best-practices**](/.github/skills/unit-test-hook-best-practices/SKILL.md) — renderHook, Harness, installStore, fixtures, subscriptions

## Command Execution Safety

Safe to auto-run (`SafeToAutoRun: true`):
- `npm run test:unit` (with any file path arguments)
- `npm run lint`
- `npm run format`

Never auto-run: git write operations, deployments, system-level package installs.

## Git Usage

Do not run git write commands (`git commit`, `git push`, `git mv`, `git reset`, `git checkout` that modifies branches, etc.). Read-only commands (`git status`, `git log`, `git diff`, `git show`, `git grep`) are allowed. Propose write commands and wait for a human to execute them.

## Project Architecture

React + Vite frontend (Cloudflare Pages) · Hono API server (Cloudflare Workers) · Supabase (RLS + Realtime).

- Auth: dual visitor/user JWT system with RLS — see [docs/authentication-system.md](/docs/authentication-system.md)
- Full skill index and key docs: [`.github/copilot-instructions.md`](/.github/copilot-instructions.md)
