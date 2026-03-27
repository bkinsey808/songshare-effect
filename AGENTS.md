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
- **No lint disable comments in test files** (`*.test.ts`, `*.test.tsx`) — fix code or move helpers to `*.test-util.*` files instead. Disables in test-util files are acceptable only when there is absolutely no alternative.
- **Avoid factory pattern for `vi.mock`** — Use single-argument `vi.mock("path")` and configure behavior with `vi.mocked(...)` in tests. Use factory only when the non-factory pattern cannot express the required setup (e.g. modules exporting constants or complex shapes).

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

## Skills

Codex (and all other models) should treat GitHub skills in this repository as available skills.

### Skill Location

- `.github/skills/*/SKILL.md`

### Trigger Rules

- If a user explicitly names a skill (for example `$lint-error-resolution` or `lint-error-resolution`), load that skill before making changes.
- If the task clearly matches a skill name or description, load the matching skill(s) before making changes.
- If multiple skills apply, use the smallest set that covers the task and state the order briefly.

### Available Skills

- `app-store-patterns` (`.github/skills/app-store-patterns/SKILL.md`)
- `authentication-system` (`.github/skills/authentication-system/SKILL.md`)
- `cloudflare-cache-cicd` (`.github/skills/cloudflare-cache-cicd/SKILL.md`)
- `code-comments` (`.github/skills/code-comments/SKILL.md`)
- `deployment-operations` (`.github/skills/deployment-operations/SKILL.md`)
- `deployment-strategies` (`.github/skills/deployment-strategies/SKILL.md`)
- `effect-ts-patterns` (`.github/skills/effect-ts-patterns/SKILL.md`)
- `file-organization` (`.github/skills/file-organization/SKILL.md`)
- `file-splitting` (`.github/skills/file-splitting/SKILL.md`)
- `form-patterns` (`.github/skills/form-patterns/SKILL.md`)
- `hono-api-patterns` (`.github/skills/hono-api-patterns/SKILL.md`)
- `internationalization` (`.github/skills/internationalization/SKILL.md`)
- `lint-error-resolution` (`.github/skills/lint-error-resolution/SKILL.md`)
- `manage-page-patterns` (`.github/skills/manage-page-patterns/SKILL.md`)
- `naming-conventions` (`.github/skills/naming-conventions/SKILL.md`)
- `playwright-testing` (`.github/skills/playwright-testing/SKILL.md`)
- `react-conventions` (`.github/skills/react-conventions/SKILL.md`)
- `realtime-rls-architecture` (`.github/skills/realtime-rls-architecture/SKILL.md`)
- `realtime-rls-debugging` (`.github/skills/realtime-rls-debugging/SKILL.md`)
- `scripts` (`.github/skills/scripts/SKILL.md`)
- `source-refactoring` (`.github/skills/source-refactoring/SKILL.md`)
- `supabase-client-patterns` (`.github/skills/supabase-client-patterns/SKILL.md`)
- `typescript-conventions` (`.github/skills/typescript-conventions/SKILL.md`)
- `unit-test-hook-best-practices` (`.github/skills/unit-test-hook-best-practices/SKILL.md`)
- `unit-test-best-practices` (`.github/skills/unit-test-best-practices/SKILL.md`)
