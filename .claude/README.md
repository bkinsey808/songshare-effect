# `.claude/` — Claude Code project configuration

This directory holds repo-level configuration for Claude Code. For the project
instruction adapter that Claude loads automatically, see
[`CLAUDE.md`](/CLAUDE.md) at the repository root.

See [`docs/ai/ai-system.md`](/docs/ai/ai-system.md) for how this fits into
the shared cross-tool AI system.

## Files in this directory

### `settings.json` (committed)

Project-level Claude Code settings. Claude Code merges this with the user-global
`~/.claude/settings.json`, with project settings taking priority for overlapping
keys.

Current hooks in this repo:

- **`hooks.PostToolUse` on `Write`** — reminds Claude to add JSDoc when a new
  `.ts` file is created.

Hook entries use these fields:

| Field | Purpose |
|---|---|
| `matcher` | Tool name to match, e.g. `"Write"`, `"Edit"`, `"Bash"` |
| `hooks[].type` | `"command"` to run a shell command |
| `hooks[].command` | Shell command; receives tool input as JSON on stdin |
| `hooks[].statusMessage` | Optional UI message shown while the hook runs |

A hook command can exit with code `2` and write a JSON
`permissionDecision: "deny"` response to stdout to block the tool call. This is
how `agents/scripts/unit-test-agent-guard.bun.ts` works when wired as a hook.

Hook events: `PreToolUse` fires before a tool executes; `PostToolUse` fires
after. Both receive the full tool input on stdin.

### `settings.local.json` (committed, but typically gitignored)

User-specific permission overrides. In most repos this file is gitignored
because it accumulates per-session `allow` entries from the interactive approval
prompt. This repo commits it to share a starting allow-list with the team.

Claude Code appends newly approved commands here (not to `settings.json`).
Clean this file periodically to remove stale one-off entries.

## What Claude Code recognizes at this path

| Path | Role | This repo |
|---|---|---|
| `.claude/settings.json` | Project hooks and permissions | In use — see above |
| `.claude/settings.local.json` | Local overrides; usually gitignored | Committed as a shared allow-list |
| `.claude/commands/` | Custom slash commands — each `.md` file becomes a `/command-name` | Not currently used |
| `.claude/README.md` | Human-facing explanation (this file) | This file |

`CLAUDE.md` at the **repo root** (not inside `.claude/`) is the project
instruction file. Claude Code loads it automatically at session start.

## User-level `~/.claude/` (global, not in the repo)

Claude Code also reads and writes files under `~/.claude/` on the local machine:

| Path | Role |
|---|---|
| `~/.claude/settings.json` | Global settings; project `settings.json` takes priority for conflicts |
| `~/.claude/keybindings.json` | Keyboard shortcut customization |
| `~/.claude/projects/<hash>/memory/` | Persistent project memory; `MEMORY.md` is the index |

The memory `<hash>` is derived from the project root path (e.g.
`-home-user-repos-songshare-effect`). `MEMORY.md` and the memory files it
indexes are loaded automatically alongside `CLAUDE.md` at session start. Memory
persists across sessions; it is a Claude Code native feature with no equivalent
in Cursor, Copilot, Codex, Gemini, or Antigravity.

## Hook scripts

Guard and helper scripts used by hooks live under
[`agents/scripts/`](/agents/scripts/), not in `.claude/`. This keeps them
shared: Cursor and Copilot also activate them via `chat.useCustomAgentHooks:
true` in `.vscode/settings.json`. The scripts handle both Cursor/Copilot tool
names and Claude Code tool names.

## See also

- [`CLAUDE.md`](/CLAUDE.md) — Claude's project instruction adapter (auto-loaded)
- [`docs/ai/ai-system.md`](/docs/ai/ai-system.md) — cross-tool layout
- [`AGENTS.md`](/AGENTS.md) — shared workflow and guardrails for all tools
- [`agents/scripts/`](/agents/scripts/) — hook scripts shared across tools
