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

## Common Commands

```bash
npm run dev
npm run dev:api:staging
npm run dev:all
npm run lint
npm run test:unit
```
