# Gemini CLI Project-Specific Instructions

This file is the Gemini-specific adapter for the shared AI system in this
repository.

## Shared Entry Points

- Read `AGENTS.md` for repository workflow and guardrails.
- Treat `.agent/rules.md` as the canonical coding-rules reference.
- Read `docs/ai-system.md` for the shared cross-tool AI-system layout.
- Load task-specific guidance from `skills/*/SKILL.md` and `agents/*.agent.md`.

## Gemini-Specific Notes

- If this file and the shared files disagree, the shared files win.
- Keep Gemini-only instructions minimal and move reusable guidance into the
  shared system.
- Safe command behavior should follow the repo rules in `.agent/rules.md`.

## Configuration

- Local frontend development uses `https://127.0.0.1:5173`.
- The API dev server runs on `http://localhost:8787`.
