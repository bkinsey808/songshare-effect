# Project Notes

Keep this file under 50 lines. Move detailed context to memory files or code comments instead.

## Linting

Always run `npm run lint` from the project root to lint code. Never use `npx eslint` directly.

## Conventions

Always add JSDoc to new hook files, following the pattern in existing hooks (e.g. `useCollapsibleSections.ts`).

## Unit Tests

Before writing unit tests, always read the relevant skill files:
- `.github/skills/unit-test-best-practices/SKILL.md` (all tests)
- `.github/skills/unit-test-hook-best-practices/SKILL.md` (hook tests: `use*.ts` / `use*.tsx`)
