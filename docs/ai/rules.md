# Agent Rules — songshare-effect

Quick-reference coding guidelines. Follow skill links for detailed guidance.

## Core Rules

- **No barrel files**: import directly from the source file — never from an `index.ts` re-export.
- **One symbol per file**: name the file after the symbol (`camelCase.ts` for functions, `PascalCase.tsx` for components). Multi-symbol files use `kebab-case.ts`. Docs use `kebab-case.md`.
- **ESM config files**: use `.js` / `.mjs` with `export default`. Never `.cjs` / `module.exports`.
- **Bun scripts**: use the `.bun.ts` extension (e.g. `scripts/postinstall-playwright.bun.ts`).
- **ReactElement is ambient**: do not import it from `react` — it is available globally.
- **JSDoc in TypeScript**: never include type annotations in JSDoc for `.ts` / `.tsx` — TypeScript provides the types. OK in plain `.js` files only.
- **Keep JSDoc current**: when you change component props, function parameters, or behavior described by a JSDoc block, update that JSDoc in the same edit.
 - **Always run lint after code changes**: After making any code change (fix, refactor, new feature, creating new files or tests, or docs that affect code), run `npm run lint` from the project root and fix any failures before marking the work as complete or opening a PR. This includes newly added files — creating a file is a code change. Do not rely on CI alone — run the lint locally first.
- **No lint disables in test files**: do not add `oxlint-disable` or `eslint-disable` in `*.test.ts` / `*.test.tsx`. Fix the code, or extract helpers into `*.test-util.*` files.
- **Strict TypeScript**: project uses `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature`. See [docs/typescript-best-practices.md](/docs/typescript-best-practices.md).
- **Tailwind string marker**: prefer `tw\`\`` for static Tailwind utility strings so they are clearly compiler-targeted.
- **No `tw\`\`` interpolation**: do not interpolate runtime values inside `tw\`\``; use CSS custom properties via `cssVars(...)` plus stable classes like `w-[var(--field-width)]` instead.

- **Prefer Effects over raw Promises for APIs**: For library, service, and shared module APIs that are intended for composition, prefer returning `Effect` types rather than raw `Promise` values. Convert Promise-based boundaries to Effects with `Effect.tryPromise` (always provide a typed `catch`). For CLI/top-level scripts, run Effects at the boundary with `Effect.runPromise` or a similar runtime wrapper. See `docs/effect-ts-best-practices.md` for patterns and examples.

- **React props**: prefer required component props and explicit presence flags; see [docs/react-best-practices.md](/docs/client/react-best-practices.md).

## Skills (load for detailed guidance)

- [**file-organization**](/skills/file-organization/SKILL.md) — no barrel files, direct imports, naming conventions
- [**source-refactoring**](/skills/source-refactoring/SKILL.md) — splitting files, default exports, test colocation, updating imports
- [**typescript-best-practices**](/skills/typescript-best-practices/SKILL.md) — strict typing, no `any`, JSDoc rules
- [**react-best-practices**](/skills/react-best-practices/SKILL.md) — React Compiler (no manual memoization), hooks, component organization
- [**lint-error-resolution**](/skills/lint-error-resolution/SKILL.md) — fix root causes; never suppress broadly
- [**unit-test-best-practices**](/skills/unit-test-best-practices/SKILL.md) — Vitest setup, mocking patterns, API handler tests, common pitfalls
- [**unit-test-hook-best-practices**](/skills/unit-test-hook-best-practices/SKILL.md) — renderHook, Harness, installStore, fixtures, subscriptions

## Command Execution Safety

Safe to auto-run (`SafeToAutoRun: true`):
- `npm run test:unit` (with any file path arguments)
- `npm run lint`
- `npm run format`

Lint rule of thumb:
- Run `npm run lint` from the project root for lint validation.
- Do not use `npx eslint` as the default lint command in this repo.
- Most repo linting flows through `oxlint`; direct `eslint` runs are only for specialized checks that explicitly require it.

Never auto-run: git write operations, deployments, system-level package installs.

## Environment Safety

- **Staging first for migrations and deploys**: Always use the staging workflow before any production migration or deployment.
- **Production requires explicit confirmation**: **NEVER** run a production deployment or production database migration without explicitly asking the user for permission first. Do not run production-linked commands such as `npm run supabase:migrate`, `npm run deploy`, `npm run deploy:api`, or `npm run deploy:pages` unless a human explicitly asks for production.
- **Prefer staging commands by default**: Use commands such as `npm run supabase:migrate:staging`, `npm run deploy:staging`, and other staging-targeted workflows for verification first.

## Git Usage

Do not run git write commands (`git commit`, `git push`, `git mv`, `git reset`, `git checkout` that modifies branches, etc.). Read-only commands (`git status`, `git log`, `git diff`, `git show`, `git grep`) are allowed. Propose write commands and wait for a human to execute them.

- Never ask the user whether to commit code changes or open a pull request. Do not prompt with messages like "Would you like me to commit these tests and open a PR?" or any variant. Only mention commits or PRs when the user explicitly requests creation or review of a PR; otherwise omit commit/PR prompts entirely.

## Project Architecture

React + Vite frontend (Cloudflare Pages) · Hono API server (Cloudflare Workers) · Supabase (RLS + Realtime).

- Auth: dual visitor/user JWT system with RLS — see [docs/authentication-system.md](/docs/auth/authentication-system.md)
- Shared AI system entrypoints: [`AGENTS.md`](/AGENTS.md), [`CLAUDE.md`](/CLAUDE.md), [`GEMINI.md`](/GEMINI.md), [`.github/copilot-instructions.md`](/.github/copilot-instructions.md), and [`.agent/README.md`](/.agent/README.md)
