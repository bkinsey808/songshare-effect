# Gemini CLI Project-Specific Instructions

This file is the Gemini-specific adapter for the shared AI system in this
repository. See the [official Gemini documentation](https://ai.google.dev/gemini-api/docs) for more information.

## Shared Entry Points

- Read `AGENTS.md` for repository workflow and guardrails.
- Treat `docs/ai/rules.md` as the canonical coding-rules reference.
- Read `docs/ai/ai-system.md` for the shared cross-tool AI-system layout.
- Load task-specific guidance from `skills/*/SKILL.md` and `agents/*.agent.md`.

## Skill Discovery & Optimization

Because Gemini does not trigger automatic background hooks, you must build context manually. The number one optimization for Gemini is the **reflexive use of the QMD search engine**.

1. **Always Search First**: Before beginning any task, you MUST run QMD to pull the specific, relevant `skills/*/SKILL.md` files into your prompt. Never assume you have full context.
2. **Use the Wrapper**: Always use the `npm run qmd --` wrapper rather than calling the binary directly. This suppresses the hundreds of lines of CMake build failure noise caused by the lack of GPU passthrough (WSL2 + Intel Arc) on this machine.
3. **Master BM25 Keywords**: Do not use vector search (`vsearch`) or hybrid search (`query`) due to the CPU bottleneck. Rely on BM25 keyword matching (`search`). Use exact technical terminology (e.g., "hono endpoint", "zustand") rather than natural language. Use the `--all` flag if exact terminology isn't yielding results.

```bash
npm run qmd -- search "<exact technical keywords>"
```

See [Skill Discovery via QMD](docs/ai/ai-system.md#skill-discovery-via-qmd) in the
AI System docs for full details.

## Gemini-Specific Notes

- If this file and the shared files disagree, the shared files win.
- Keep Gemini-only instructions minimal and move reusable guidance into the
  shared system.
- Safe command behavior should follow the repo rules in `docs/ai/rules.md`.

## Configuration

- Local frontend development uses `https://127.0.0.1:5173`.
- The API dev server runs on `http://localhost:8787`.
