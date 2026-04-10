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
- **Strict TypeScript**: project uses `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`. See [docs/typescript-best-practices.md](/docs/typescript-best-practices.md).
- **Tailwind string marker**: prefer `tw\`\`` for static Tailwind utility strings so they are clearly compiler-targeted.
- **No `tw\`\`` interpolation**: do not interpolate runtime values inside `tw\`\``; use CSS custom properties via `cssVars(...)` plus stable classes like `w-[var(--field-width)]` instead.

- **React props**: prefer required component props and explicit presence flags; see [docs/react-best-practices.md](/docs/client/react-best-practices.md).

## Skills (load for detailed guidance)

- [**file-organization**](/.github/skills/file-organization/SKILL.md) — no barrel files, direct imports, naming conventions
- [**source-refactoring**](/.github/skills/source-refactoring/SKILL.md) — splitting files, default exports, test colocation, updating imports
- [**typescript-best-practices**](/.github/skills/typescript-best-practices/SKILL.md) — strict typing, no `any`, JSDoc rules
- [**react-best-practices**](/.github/skills/react-best-practices/SKILL.md) — React Compiler (no manual memoization), hooks, component organization
- [**lint-error-resolution**](/.github/skills/lint-error-resolution/SKILL.md) — fix root causes; never suppress broadly
- [**unit-test-best-practices**](/.github/skills/unit-test-best-practices/SKILL.md) — Vitest setup, mocking patterns, API handler tests, common pitfalls
- [**unit-test-hook-best-practices**](/.github/skills/unit-test-hook-best-practices/SKILL.md) — renderHook, Harness, installStore, fixtures, subscriptions

## Command Execution Safety

Safe to auto-run (`SafeToAutoRun: true`):
- `npm run test:unit` (with any file path arguments)
- `npm run lint`
- `npm run format`

Never auto-run: git write operations, deployments, system-level package installs.

## Environment Safety

- **Staging first for migrations and deploys**: Always use the staging workflow before any production migration or deployment.
- **Production requires explicit confirmation**: Do not run production-linked commands such as `npm run supabase:migrate`, `npm run deploy`, `npm run deploy:api`, or `npm run deploy:pages` unless a human explicitly asks for production.
- **Prefer staging commands by default**: Use commands such as `npm run supabase:migrate:staging`, `npm run deploy:staging`, and other staging-targeted workflows for verification first.

## Git Usage

Do not run git write commands (`git commit`, `git push`, `git mv`, `git reset`, `git checkout` that modifies branches, etc.). Read-only commands (`git status`, `git log`, `git diff`, `git show`, `git grep`) are allowed. Propose write commands and wait for a human to execute them.

## Project Architecture

React + Vite frontend (Cloudflare Pages) · Hono API server (Cloudflare Workers) · Supabase (RLS + Realtime).

- Auth: dual visitor/user JWT system with RLS — see [docs/authentication-system.md](/docs/auth/authentication-system.md)
- Full skill index and key docs: [`.github/copilot-instructions.md`](/.github/copilot-instructions.md)
