# GitHub Copilot Instructions

This file is the Copilot-specific adapter for the shared AI system in this
repository.

## Shared Entry Points

- Read [AGENTS.md](/AGENTS.md) for repo workflow and guardrails.
- Treat [docs/ai/rules.md](/docs/ai/rules.md) as the canonical coding-rules
  reference.
- Read [docs/ai/ai-system.md](/docs/ai/ai-system.md) for the shared cross-tool AI
  layout.
- Load task-specific guidance from `skills/*/SKILL.md` and `agents/*.agent.md`.

## Copilot-Specific Notes

- Prefer the shared skills and shared custom agents over Copilot-only guidance.
- If this file ever disagrees with the shared files above, the shared files win.
- Keep this file short; add reusable guidance to `skills/`, `agents/`, or
  `docs/ai/rules.md` instead.

**Project-specific typing note:** This repository exposes `ReactElement` as an
ambient/ambient-global type (no explicit `import type { ReactElement } from
"react"` is required). Do not add an import for `ReactElement`; prefer using the ambient type.

**Comments / JSDoc edits:** The Code Comment Agent may add or update comments and
JSDoc in `.ts` and `.tsx` files (comment-only edits are allowed). Do not modify
function bodies, implementations, or other runtime logic unless explicitly
requested by a human reviewer.

## Agent Behavior

- Never ask the user whether to commit code changes or open a pull request. Do not prompt with messages like "Would you like me to commit these tests and open a PR?" or any variant. Only mention commits or PRs when the user explicitly requests creation or review of a PR; otherwise omit commit/PR prompts entirely.

## Effect Guidance for Code Generation

- Prefer emitting functions that return an `Effect` for library/service APIs when appropriate. At async boundaries, convert Promises to Effects with `Effect.tryPromise` and provide a typed `catch`. For CLI or top-level scripts, run Effects via `Effect.runPromise` at the runtime boundary.

## Common Commands

```bash
npm run dev
npm run dev:api:staging
npm run dev:all
npm run lint
npm run test:unit
```

Note: Creating a new file (including tests) or modifying existing files is considered a code change — run `npm run lint` locally after such edits and fix any failures before opening a PR.
