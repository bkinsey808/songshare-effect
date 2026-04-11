---
name: ai-system
description: >
  Explain, update, or audit the repository's cross-tool AI system. Use when the
  user asks how Copilot, Claude, Codex, Antigravity, Cursor, Gemini, skills,
  custom agents, or tool adapters are organized. Do not use for ordinary code
  changes that only need domain-specific implementation guidance.
user-invocable: true
---

# AI System

## Use When

- Explaining how the repo's AI guidance is organized.
- Deciding whether something belongs in `skills/`, `agents/`, `docs/ai/`, or a
  tool-specific adapter.
- Updating adapter files such as `.github/copilot-instructions.md`, `CLAUDE.md`,
  `GEMINI.md`, `.cursor/rules/*.mdc`, or `.agent/workflows/*.md`.
- Auditing whether multiple AI tools still point to the same shared source of
  truth.
- Clarifying which tools use shared `skills/` or shared `agents/`.

---

## Execution Workflow

1. Read [`docs/ai/ai-system.md`](/docs/ai/ai-system.md) first.
2. Check [`AGENTS.md`](/AGENTS.md) and [`docs/ai/rules.md`](/docs/ai/rules.md)
   for shared entry-point and rule changes.
3. Read only the tool-specific adapter files relevant to the request.
4. Prefer updating shared layers before updating tool-specific adapters.
5. When changing paths or AI-system docs, run the relevant AI-system validation
   commands.

---

## Key Patterns

- `docs/ai/rules.md` is the canonical coding-rules reference.
- `skills/*/SKILL.md` are shared cross-tool task guides.
- `agents/*.agent.md` are shared cross-tool focused agent prompts and hooks.
- `.github/`, `.cursor/`, `CLAUDE.md`, `GEMINI.md`, and `.agent/workflows/`
  are adapter or tool-specific layers, not the canonical rules layer.
- Keep adapters thin: they should point back to shared files rather than
  duplicating large rule lists.
- Use `.agent/workflows/` for Antigravity execution playbooks, not for general
  shared coding rules.

---

## References

- Primary reference: [docs/ai/ai-system.md](/docs/ai/ai-system.md)
- Canonical rules: [docs/ai/rules.md](/docs/ai/rules.md)
- Repo entry point: [AGENTS.md](/AGENTS.md)
- Skill authoring: [skills/write-skill/SKILL.md](/skills/write-skill/SKILL.md)
- Skill reference: [docs/skill-best-practices.md](/docs/skill-best-practices.md)

## Do Not

- Do not duplicate the full AI-system document in the skill.
- Do not put long per-tool historical notes in the skill body; keep them in
  `docs/ai/ai-system.md`.
- Do not move shared coding rules into tool-specific adapter files.
- Do not assume every tool consumes `skills/` and `agents/` in the same way;
  confirm against the current adapter files and AI-system doc.
