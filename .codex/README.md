# `.codex/` — Codex project configuration

This directory holds repo-level Codex configuration for SongShare Effect. The
shared project instructions still live in [`AGENTS.md`](/AGENTS.md),
[`docs/ai/rules.md`](/docs/ai/rules.md), [`skills/`](/skills), and
[`agents/`](/agents).

Use this directory only for Codex-native wiring that the shared layers cannot
express directly.

See [`docs/ai/ai-system.md`](/docs/ai/ai-system.md) for how `.codex/` fits into
the cross-tool AI system.

## What Codex recognizes under project `.codex/`

These paths are recognized by Codex when present in a trusted repository,
according to the current OpenAI Codex docs:

| Path | Role | This repo |
| --- | --- | --- |
| `.codex/config.toml` | Project-scoped Codex config overrides | In use |
| `.codex/hooks.json` | Repo-local Codex hooks | In use |
| `.codex/agents/*.toml` | Project-scoped custom agents | In use |

Files such as `.codex/README.md` are for humans only. Codex does not treat this
README as a special configuration file.

## Files In This Directory

### `config.toml`

Project-scoped Codex config. Codex supports a project override at
`.codex/config.toml`.

This repo currently uses it for:

- `features.codex_hooks = true`
- `[agents]`
  `max_threads = 6` and `max_depth = 1` to match Codex's documented subagent
  controls

Keep this file small and focused on Codex-native settings. Do not duplicate the
repo's shared coding rules here.

### `hooks.json`

Repo-local hook wiring for Codex. Codex loads `.codex/hooks.json` alongside any
user-global `~/.codex/hooks.json`.

Current hooks in this repo:

- `SessionStart` with `matcher: "startup|resume"`:
  loads a short context reminder from
  [`hooks/session-start-context.sh`](./hooks/session-start-context.sh)
- `PreToolUse` with `matcher: "Bash"`:
  runs the shared
  [`agents/scripts/block-dangerous-commands.bun.ts`](/agents/scripts/block-dangerous-commands.bun.ts)
  guard before Bash commands

Important current Codex limitation:

- `PreToolUse` and `PostToolUse` currently only emit for `Bash`, so these hooks
  are useful guardrails, not full enforcement for non-shell tools

### `agents/`

Project-scoped custom-agent wrappers for Codex. Each `.toml` file defines one
custom agent.

This repo keeps these wrappers thin. They should:

- point back to the canonical shared prompt under [`/agents/`](/agents)
- load the relevant shared skills from [`/skills/`](/skills)
- add only Codex-specific defaults such as model, reasoning effort, or sandbox
  mode

Current wrappers in this repo:

- `typescript-react.toml`
- `unit-test.toml`
- `lint-resolution.toml`
- `playwright.toml`
- `code-comment.toml`

### `hooks/`

Helper scripts referenced from `hooks.json`.

This directory name is a repo convention, not a special Codex configuration
location by itself. Codex only cares that `hooks.json` points to valid
commands. We keep hook helpers here because that matches the Codex docs'
examples and makes the hook layout easy to scan.

Current file:

- `session-start-context.sh`

## What Stays Outside `.codex/`

Codex-specific wiring lives here, but the shared source of truth does not.

| Location | Purpose |
| --- | --- |
| [`AGENTS.md`](/AGENTS.md) | Shared repo instructions and workflow guardrails |
| [`api/AGENTS.md`](/api/AGENTS.md), [`react/AGENTS.md`](/react/AGENTS.md), [`shared/AGENTS.md`](/shared/AGENTS.md) | Nested directory-specific instruction layers that Codex also loads |
| [`docs/ai/rules.md`](/docs/ai/rules.md) | Canonical coding rules |
| [`skills/`](/skills) | Shared reusable task guidance |
| [`agents/`](/agents) | Shared focused agent prompts |

Rule of thumb:

- change shared behavior in `AGENTS.md`, `docs/ai/rules.md`, `skills/`, or
  `agents/` first
- change `.codex/` only when you need Codex-native config, hooks, or custom
  agents

## See Also

- [`AGENTS.md`](/AGENTS.md)
- [`docs/ai/rules.md`](/docs/ai/rules.md)
- [`docs/ai/ai-system.md`](/docs/ai/ai-system.md)
- [`agents/`](/agents)
- [`skills/`](/skills)
