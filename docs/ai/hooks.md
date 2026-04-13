# AI hooks in this repository

This document is the **canonical map** of lifecycle hooks: where they live, which
tools run them, and what each one does. It complements [`docs/ai/ai-system.md`](ai-system.md)
(which explains the whole AI system) and [`docs/ai/qmd.md`](qmd.md) (QMD CLI,
indexing, and QMD-specific hook behavior).

Read this when you are:

- adding or changing a hook
- debugging why a hook did or did not run
- choosing where a new hook should live
- comparing hook behavior across Copilot, Cursor, Claude Code, and Codex

## Table of contents

- [`.vscode/settings.json` — enabling Copilot and Cursor hooks](#vscode-settings-json--enabling-copilot-and-cursor-hooks)
- [Cross-tool hook matrix](#cross-tool-hook-matrix)
- [Design rule: Copilot and Cursor](#design-rule-copilot-and-cursor)
- [`.github/hooks/` — shared VS Code agent hooks](#github-hooks--shared-vs-code-agent-hooks)
- [QMD-related hooks (summary)](#qmd-related-hooks-summary)
- [`.github/hooks/` vs GitHub.com](#githubhooks-vs-githubcom)
- [`.claude/settings.json` — Claude Code](#claudesettingsjson--claude-code)
- [Cursor and Claude hooks (optional overlap)](#cursor-and-claude-hooks-optional-overlap)
- [`agents/*.agent.md` — agent-scoped hooks](#agentsagentmd--agent-scoped-hooks)
- [Helper scripts (`agents/scripts/`)](#helper-scripts-agentsscripts)
- [`.codex/hooks.json` — Codex](#codexhooksjson--codex)
- [Gemini and Antigravity](#gemini-and-antigravity)
- [See also](#see-also)

---

<a id="vscode-settings-json--enabling-copilot-and-cursor-hooks"></a>

## `.vscode/settings.json` — enabling Copilot and Cursor hooks

[`.vscode/settings.json`](/.vscode/settings.json) is part of **Cursor and GitHub
Copilot** wiring in this repo. Relevant entries:

- `"chat.agentSkillsLocations": { "skills/": true }` — root `skills/` (not `.cursor/skills/`)
- `"chat.agentFilesLocations": { "agents/": true }` — root `agents/`
- `"chat.useCustomAgentHooks": true` — required for [`.github/hooks/`](#github-hooks--shared-vs-code-agent-hooks) and for `hooks:` in [`agents/*.agent.md`](#agentsagentmd--agent-scoped-hooks)

These `chat.*` settings are **not** read by Claude Code, Codex, Gemini, or
Antigravity. Those tools use their own config files (see [matrix](#cross-tool-hook-matrix)).

---

<a id="cross-tool-hook-matrix"></a>

## Cross-tool hook matrix

| Mechanism | Copilot / Cursor (VS Code) | Claude Code | Codex | Gemini / Antigravity |
| --- | --- | --- | --- | --- |
| [`.github/hooks/*.json`](#github-hooks--shared-vs-code-agent-hooks) | Yes — if `chat.useCustomAgentHooks` | No | No | No |
| [`hooks:` in `agents/*.agent.md`](#agentsagentmd--agent-scoped-hooks) | Yes — if `useCustomAgentHooks` and agent active | No | No | No |
| [`.claude/settings.json`](#claudesettingsjson--claude-code) | Optional — if Cursor **Third-party skills** loads Claude config | Yes | No | No |
| [`.codex/hooks.json`](#codexhooksjson--codex) | No | No | Yes | No |

Claude finds skills and agents via prose in [`AGENTS.md`](/AGENTS.md) and
[`CLAUDE.md`](/CLAUDE.md), not via `chat.agentSkillsLocations` / `chat.useCustomAgentHooks`.

---

<a id="design-rule-copilot-and-cursor"></a>

## Design rule: Copilot and Cursor

Workspace hooks for **GitHub Copilot** and **Cursor** are committed **only**
under [`.github/hooks/`](/.github/hooks/). Both tools consume the **same** JSON
files through `chat.useCustomAgentHooks: true`. Do **not** duplicate shared
automation under [`.cursor/hooks.json`](/.cursor/README.md) — use `.cursor/hooks.json`
only for **Cursor-only** hooks that Copilot does not need.

More context: [`.github/README.md`](/.github/README.md), [`.cursor/README.md`](/.cursor/README.md).

---

<a id="github-hooks--shared-vs-code-agent-hooks"></a>

## `.github/hooks/` — shared VS Code agent hooks

| File | Event | Script | Role |
| --- | --- | --- | --- |
| [`qmd-session-context.json`](/.github/hooks/qmd-session-context.json) | `SessionStart` | [`qmd-session-start-context.bun.ts`](/agents/scripts/qmd-session-start-context.bun.ts) | Injects stable QMD usage guidance at session start |
| [`qmd-user-prompt-context.json`](/.github/hooks/qmd-user-prompt-context.json) | `UserPromptSubmit` | [`qmd-user-prompt-context.bun.ts`](/agents/scripts/qmd-user-prompt-context.bun.ts) | Filtered compact `qmd search` on task-shaped prompts |
| [`block-dangerous-commands.json`](/.github/hooks/block-dangerous-commands.json) | `PreToolUse` | [`block-dangerous-commands.bun.ts`](/agents/scripts/block-dangerous-commands.bun.ts) | Blocks obviously dangerous shell commands before execution |

These hook surfaces are **real** Copilot and Cursor capabilities in VS Code. They
are **not** the same implementation as Claude Code’s
[`.claude/settings.json`](/.claude/settings.json), but they are sufficient for
policy enforcement, tool gating, and some context injection.

---

<a id="qmd-related-hooks-summary"></a>

## QMD-related hooks (summary)

[QMD](https://github.com/tobi/qmd) indexes `skills/` and `docs/`. Hook behavior in depth: [`docs/ai/qmd.md`](qmd.md).

| Path | When | What happens |
| --- | --- | --- |
| Claude — [`.claude/hooks/qmd-context.sh`](/.claude/hooks/qmd-context.sh) | Every user prompt (`UserPromptSubmit`) | Full `qmd search` with excerpt-style `additionalContext` |
| Copilot/Cursor — [`qmd-session-context.json`](#github-hooks--shared-vs-code-agent-hooks) | Session start | Stable guidance to use `npm run qmd -- search` |
| Copilot/Cursor — [`qmd-user-prompt-context.json`](#github-hooks--shared-vs-code-agent-hooks) | User prompt (filtered) | Compact BM25 summary — **not** a full replacement for manual search |

The VS Code `UserPromptSubmit` hook is **intentionally filtered and compact**; the
manual [`AGENTS.md`](/AGENTS.md) workflow (`npm run qmd -- search "<task>"`) still
matters for deeper retrieval. Codex, Gemini, and Antigravity follow manual QMD in
this repo.

---

<a id="githubhooks-vs-githubcom"></a>

## `.github/hooks/` vs GitHub.com

Under [`.github/`](https://github.com/) in this repo:

- `.github/workflows/*.yml` — GitHub Actions (GitHub.com runs these)
- `.github/copilot-instructions.md` — Copilot adapter (not Actions)
- `.github/README.md` — human documentation
- **`.github/hooks/`** — **local** editor/agent tooling (Copilot/Cursor). GitHub.com
  does **not** execute these hooks.

So “under `.github/`” does not mean “GitHub the platform runs it.” Full directory
breakdown: [`/.github/README.md`](/.github/README.md).

---

<a id="claudesettingsjson--claude-code"></a>

## `.claude/settings.json` — Claude Code

Claude Code has its own hook mechanism in
[`.claude/settings.json`](/.claude/settings.json) using `PreToolUse`,
`PostToolUse`, `UserPromptSubmit`, and other event keys. It is **completely
separate** from the `hooks:` field in `agents/*.agent.md` frontmatter (which
[Cursor and Copilot](#agentsagentmd--agent-scoped-hooks) process via
`chat.useCustomAgentHooks` but **Claude Code ignores**).

Registered hooks in this repo:

- **`UserPromptSubmit`** — runs `qmd search` against the user’s prompt and injects
  matching skill and doc excerpts as `additionalContext` before Claude responds.
  Implemented in [`.claude/hooks/qmd-context.sh`](/.claude/hooks/qmd-context.sh).
- **`PostToolUse`** with matcher `Write` — reminds Claude to add JSDoc to new
  `.ts` files (inline shell in [`.claude/settings.json`](/.claude/settings.json)).

**Agent-level guards** (for example [`unit-test-agent-guard.bun.ts`](/agents/scripts/unit-test-agent-guard.bun.ts))
only fire for **Cursor and Copilot** when the corresponding custom agent is
active. Claude relies on agent file instructions rather than that hook.

---

<a id="cursor-and-claude-hooks-optional-overlap"></a>

## Cursor and Claude hooks (optional overlap)

If **Settings → Features → Third-party skills** is enabled, Cursor can load
[`.claude/settings.json`](/.claude/settings.json) hooks ([third-party hooks](https://cursor.com/docs/reference/third-party-hooks)).
That can **overlap** with [`.github/hooks/`](#github-hooks--shared-vs-code-agent-hooks)
QMD behavior on the same prompt (same general goal, different format). Prefer one
stack if it feels noisy. Details: [`docs/ai/qmd.md` § Cursor](qmd.md#cursor),
[`.cursor/README.md`](/.cursor/README.md).

---

<a id="agentsagentmd--agent-scoped-hooks"></a>

## `agents/*.agent.md` — agent-scoped hooks

The `hooks:` field in `agents/*.agent.md` frontmatter is processed by **Cursor
and Copilot** via `chat.useCustomAgentHooks: true` in `.vscode/settings.json`. It
is **not** processed by Claude Code, Codex, Gemini, or Antigravity.

| Agent | Hook | Script |
| --- | --- | --- |
| [Unit Test Agent.agent.md](/agents/Unit%20Test%20Agent.agent.md) | `PreToolUse` | [`unit-test-agent-guard.bun.ts`](/agents/scripts/unit-test-agent-guard.bun.ts) |

Codex uses [`.codex/hooks.json`](#codexhooksjson--codex) for repo-local hook
wiring instead of agent frontmatter.

Use `agents/*.agent.md` when the task benefits from a bounded persona or tool
policy. Use `skills/` when the task needs reusable procedural guidance (same
distinction as in [`docs/ai/ai-system.md`](ai-system.md) — Shared Custom Agents).

---

<a id="helper-scripts-agentsscripts"></a>

## Helper scripts (`agents/scripts/`)

Scripts invoked by hooks and shared agents include:

- [`block-dangerous-commands.bun.ts`](/agents/scripts/block-dangerous-commands.bun.ts) — `.github/hooks` and Codex `PreToolUse` (Bash)
- [`unit-test-agent-guard.bun.ts`](/agents/scripts/unit-test-agent-guard.bun.ts) — Unit Test Agent frontmatter
- [`qmd-session-start-context.bun.ts`](/agents/scripts/qmd-session-start-context.bun.ts) — QMD session hook
- [`qmd-user-prompt-context.bun.ts`](/agents/scripts/qmd-user-prompt-context.bun.ts) — QMD user-prompt hook

---

<a id="codexhooksjson--codex"></a>

## `.codex/hooks.json` — Codex

[`.codex/hooks.json`](/.codex/hooks.json) is **Codex-specific**. It is not read by
Copilot or Cursor as part of `.vscode/settings.json`.

This repo uses it for:

- **`SessionStart`** (matcher `startup|resume`) — runs
  [`.codex/hooks/session-start-context.sh`](/.codex/hooks/session-start-context.sh)
  for session context
- **`PreToolUse`** (matcher `Bash`) — runs
  [`block-dangerous-commands.bun.ts`](/agents/scripts/block-dangerous-commands.bun.ts)
  (same guard as `.github/hooks`, different integration surface)

Codex does **not** use:

- `.vscode/settings.json` `chat.agentSkillsLocations` / `chat.agentFilesLocations` / `chat.useCustomAgentHooks`
- `.cursor/rules/*.mdc`
- `hooks:` frontmatter in `agents/*.agent.md`
- `.claude/settings.json` hooks

Broader Codex layout: [`docs/ai/ai-system.md`](ai-system.md) (Codex section).

---

<a id="gemini-and-antigravity"></a>

## Gemini and Antigravity

Gemini and Antigravity do not currently support automated prompt-time hooks in
this repository. Instead, they rely on **explicit discovery** through manual
commands and Antigravity-specific workflows.

### Antigravity / Playbooks

Antigravity handles task discovery via **workflows** (playbooks) under
[`.agent/workflows/`](/.agent/workflows/). These are triggered by slash commands
such as:

- **`/qmd`**: Runs the [QMD discovery workflow](/.agent/workflows/qmd.md) to find relevant skills.
- **`/troubleshoot`**: Runs the [troubleshooting workflow](/.agent/workflows/troubleshoot.md).

While these are not "lifecycle hooks" that run automatically before a prompt,
they are the functional equivalent for this tool.

### Gemini

Gemini-based agents follow the [`AGENTS.md`](/AGENTS.md) and [`GEMINI.md`](/GEMINI.md)
conventions for manual QMD search. There is no automated hook injection for
Gemini in this repo.

---

<a id="see-also"></a>

## See also

- [`docs/ai/ai-system.md`](ai-system.md) — full cross-tool AI layout
- [`docs/ai/qmd.md`](qmd.md) — QMD CLI, collections, and QMD hook details
- [`AGENTS.md`](/AGENTS.md) — workflow; manual `npm run qmd -- search` when hooks are not enough
