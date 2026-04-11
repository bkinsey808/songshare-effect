# AGENTS.md

Repo-wide instructions for AI coding agents working in SongShare Effect.

## Read First

1. `docs/ai/rules.md` for canonical coding rules.
2. `README.md` for product architecture and common commands.
3. `docs/ai/ai-system.md` for the shared cross-tool AI-system layout.
4. `skills/*/SKILL.md` and `agents/*.agent.md` for task-specific guidance.
5. `.agent/workflows/*.md` when you are using Antigravity-specific workflow playbooks alongside the shared skills system.

Model-specific files such as `.github/copilot-instructions.md`, `CLAUDE.md`,
`GEMINI.md`, and `.cursor/rules/` should stay thin and point back to this
shared system.

## Core Rules

- No barrel files; use direct imports from source files.
- Keep TypeScript strict; avoid `any`.
- Be React Compiler friendly; avoid manual memoization unless clearly needed.
- Do not repeat types in JSDoc for `.ts` or `.tsx` files.
- Use ESM for config files.
- Keep docs in `docs/` kebab-case.
- Colocate unit tests with source files.
- Prefer `tw\`\`` for static Tailwind strings; do not interpolate runtime values into `tw\`\``.
- Do not add lint-disable comments in `*.test.ts` or `*.test.tsx`.
- Avoid factory-style `vi.mock` unless the non-factory form cannot express the setup.

## Workflow

- Inspect only the files relevant to the task.
- Prefer minimal, root-cause fixes over surface patches.
- Run the narrowest relevant validation first, then broader checks if needed.
- Update docs when behavior or developer workflow changes.
- Do not fix unrelated failures unless the user asks.

## Safety

- Prefer read-only git commands unless a human explicitly asks for repo-changing operations.
- Use staging-first for migrations and deployments; require explicit confirmation for production.

## Skills And Agents

- All shared skills live under `skills/*/SKILL.md`.
- Shared skills are intended for Copilot, Claude, Codex, Antigravity, Cursor, and Gemini.
- All shared agent prompts live under `agents/*.agent.md`.
- Shared agent prompts are intended for Copilot, Claude, Codex, Antigravity, Cursor, and Gemini.
- Antigravity-specific workflow playbooks live under `.agent/workflows/` and complement the shared skills layer.
- If a user names a skill, load it before making changes.
- If the task clearly matches a skill, load the smallest relevant set.

### Available Skills

- `ai-system`
- `app-store-patterns`
- `authentication-system`
- `cloudflare-cache-cicd`
- `code-comment-best-practices`
- `deployment-operations`
- `deployment-strategies`
- `doc-best-practices`
- `effect-ts-patterns`
- `file-organization`
- `file-splitting`
- `form-patterns`
- `hono-best-practices`
- `internationalization`
- `lint-error-resolution`
- `lint-first-authoring`
- `manage-page-patterns`
- `naming-conventions`
- `playwright-best-practices`
- `playwright-testing`
- `react-best-practices`
- `realtime-rls-architecture`
- `realtime-rls-debugging`
- `scripts`
- `skill-best-practices`
- `source-refactoring`
- `supabase-client-patterns`
- `typescript-best-practices`
- `unit-test-best-practices`
- `unit-test-hook-best-practices`
- `write-skill`
- `zustand-best-practices`
