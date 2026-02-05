# Code Comments

This directory complements the `SKILL.md` with a quick reference for reviewers and contributors.

Key rules:

- **No types in JSDoc** — omit TypeScript types in comments; use parameter descriptions only.
- **JSDoc for symbols** — use `/** */` above exported functions, components, and types.
- **Inline `//` for logic** — place `//` comments above non-symbol code (e.g., `useEffect`, complex conditionals).
- **Placement** — comments must be on the line(s) immediately above the target code.
- **Keep lines <= 100 chars** — break into multiple lines when necessary.

See also: `/.cursor/rules/comment-agent.mdc` and `.github/agents/Comment Agent.agent.md` for canonical examples and tooling.
