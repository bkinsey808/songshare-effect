# AGENTS.md

Guidance for AI coding agents working in this repository.

## Purpose

This repo is **SongShare Effect**: a React + Vite frontend with a Hono + Effect-TS API, deployed to Cloudflare and backed by Supabase.

Use this file as a quick operational playbook. The canonical coding rules remain in `.agent/rules.md`.

## Read First

1. `.agent/rules.md` (source of truth for project rules)
2. `.github/copilot-instructions.md` (agent orientation + linked skills)
3. `README.md` (architecture + command overview)

For task-specific work, also consult docs in `docs/` (especially auth and Effect implementation docs).

## Non-Negotiable Rules

- **No barrel files** (`index.ts` re-export hubs are disallowed)
- **Use direct imports** from source files
- **TypeScript strictness**: avoid `any`
- **React Compiler friendly**: avoid manual memoization unless clearly necessary
- **JSDoc in TS/TSX**: do not repeat types in JSDoc
- **Config files use ESM** (`export default`, no CommonJS)
- **Docs filenames in `docs/` are kebab-case**
- **Colocate unit tests** next to source files when adding tests

## Git Safety

- Prefer read-only git operations for analysis (`status`, `diff`, `log`, `show`, `grep`)
- Do not run repository-changing git commands unless explicitly requested by a human

## Repo Layout (High Level)

- `react/` — frontend app
- `api/` — Hono + Effect-TS API
- `shared/` — shared schemas/types/utilities
- `functions/` — Cloudflare Pages Functions
- `e2e/` — Playwright tests
- `scripts/` — repo utilities and automation
- `docs/` — implementation and architecture docs

## Development Commands

- Install deps: `npm install`
- Start app + API: `npm run dev:all`
- Frontend only: `npm run dev:client`
- API only: `npm run dev:api`
- Build all: `npm run build:all`
- Lint: `npm run lint`
- Format: `npm run format`
- Unit tests: `npm run test:unit`
- E2E (dev): `npm run test:e2e:dev`

## Agent Workflow

1. Understand the request and inspect only relevant files.
2. Make minimal, targeted changes consistent with existing patterns.
3. Prefer root-cause fixes over surface patches.
4. Validate with the narrowest relevant checks first (targeted tests/lint), then broader checks if needed.
5. Update docs when behavior or developer workflow changes.

## Validation Guidance

- For focused logic changes: run nearest unit tests first.
- For broader refactors: run `npm run test:unit` and `npm run lint`.
- For routing/auth/critical user flows: consider `npm run test:e2e:dev` when feasible.

Do not fix unrelated failing tests/lint unless requested.

## Auth and API Notes

- The project uses a dual-token auth model (visitor + user JWTs) with Supabase RLS.
- Review `docs/authentication-system.md` before changing auth behavior.
- For API handler/service work, follow Effect-TS error and schema patterns described in `docs/effect-implementation.md`.

## When Creating or Refactoring Files

- Prefer one primary symbol per file where practical.
- Keep naming consistent with surrounding code.
- Update all imports/references when moving symbols.
- Keep tests colocated and aligned with project naming (`*.test.ts` / `*.test.tsx` for unit tests; Playwright specs under `e2e/`).

## Definition of Done

- Requested behavior implemented
- Rules above respected
- Relevant checks pass (or failures clearly reported)
- Any changed developer-facing behavior documented
