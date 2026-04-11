# Claude Notes

Keep this file under 50 lines. Move detailed context to memory files or code comments instead.

This file is a Claude-specific adapter for the shared AI system in `AGENTS.md`,
`skills/`, and `agents/`.

## Shared Context

- Read `AGENTS.md` for repository workflow and guardrails.
- Treat `docs/ai/rules.md` as the canonical source of coding standards.
- Read `docs/ai/ai-system.md` for the shared cross-tool AI-system layout.
- Load reusable task guidance from `skills/*/SKILL.md`.
- Load shared focused agent prompts from `agents/*.agent.md` when a task matches one of the repo's custom agent roles.

## Linting

Always run `npm run lint` from the project root to lint code. Never use `npx eslint` directly.

## Conventions

Always add JSDoc to new hook files, following the pattern in existing hooks (e.g. `useCollapsibleSections.ts`).

## Unit Tests

Before writing unit tests, always read the relevant skill files:
- `skills/unit-test-best-practices/SKILL.md` (all tests)
- `skills/unit-test-hook-best-practices/SKILL.md` (hook tests: `use*.ts` / `use*.tsx`)
