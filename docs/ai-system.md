# AI System

This document describes how the shared AI guidance in this repository is
organized. Read it when updating agent docs, migrating tool-specific rules, or
checking whether Copilot, Claude, Gemini, Cursor, and Codex are all following
the same source of truth.

## Table of Contents

- [Shared Entry Points](#shared-entry-points)
- [Tool Adapters](#tool-adapters)
- [Compatibility Rules](#compatibility-rules)
- [Validation](#validation)
- [See Also](#see-also)

---

<a id="shared-entry-points"></a>

## Shared Entry Points

The cross-tool setup has four layers:

1. `AGENTS.md` defines repository workflow, safety, and where to look next.
2. `.agent/rules.md` is the canonical coding-rules reference.
3. `skills/*/SKILL.md` contains reusable task guidance.
4. `agents/*.agent.md` contains reusable custom agent prompts and hooks.

Use these files as the shared system for all tools. When a rule changes, update
the shared layer first and keep tool adapters thin.

---

<a id="tool-adapters"></a>

## Tool Adapters

These files should be adapters, not alternate sources of truth:

- `.github/copilot-instructions.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.cursor/rules/*.mdc`

Each adapter should primarily do three things:

- point back to `AGENTS.md`, `.agent/rules.md`, `skills/`, and `agents/`
- add only tool-specific wiring that the shared files cannot express
- stay short enough that drift is obvious during review

`README.md` is still useful for project architecture and commands, but it should
not be the canonical location for AI-system rules.

---

<a id="compatibility-rules"></a>

## Compatibility Rules

Keep these invariants intact:

- Shared skills live under `skills/*/SKILL.md`.
- Shared custom agents live under `agents/*.agent.md`.
- Do not reintroduce the old GitHub-scoped skill or agent directories.
- Prefer root-relative markdown links such as `/skills/foo/SKILL.md`.
- Keep model-specific files thin and avoid duplicating large rule lists.
- When migrating paths or docs, update validation so stale references fail fast.

If a tool requires extra metadata, add the smallest possible amount and keep the
actual behavioral guidance in the shared files.

---

<a id="validation"></a>

## Validation

Use these checks after changing the AI system:

```bash
npm run check:ai-system
npm run check:skill-line-count
npm run check:links
```

`check:ai-system` verifies shared guidance files for known stale migration paths
and basic agent-frontmatter consistency. `check:skill-line-count` keeps shared
skills and agent prompts concise. `check:links` catches broken internal links.

---

<a id="see-also"></a>

## See Also

- [AGENTS.md](/AGENTS.md)
- [.agent/rules.md](/.agent/rules.md)
- [README.md](/README.md)
- [docs/doc-best-practices.md](/docs/doc-best-practices.md)
- [docs/skill-best-practices.md](/docs/skill-best-practices.md)
