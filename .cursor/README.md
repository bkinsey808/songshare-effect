# `.cursor/` — Cursor-specific AI wiring

This folder holds **Cursor-only adapters** for the shared AI system described in [`docs/ai/ai-system.md`](../docs/ai/ai-system.md) and [`AGENTS.md`](../AGENTS.md). Behavioral rules and long procedures live in `docs/ai/`, `skills/`, and `agents/`; keep Cursor-specific files thin so drift from the shared system is easy to spot.

**Skills in this repository:** Cursor’s default project skills folder is **`.cursor/skills/`**. **This repo does not use that directory.** Add and edit skills under the **workspace root** [`skills/`](../skills/) tree instead (`skills/<name>/SKILL.md`), as configured by `chat.agentSkillsLocations` in [`.vscode/settings.json`](../.vscode/settings.json). Do not create `.cursor/skills/` here unless you intentionally want a second, separate skills root.

## What Cursor can load under **project** `.cursor/`

These paths are **recognized by Cursor** when present in a repository (names and behavior follow [Cursor’s docs](https://cursor.com/docs); details may change between app versions):

| Path | Role |
| --- | --- |
| **`rules/`** | **Project rules** — `.md` or `.mdc` files. Use `.mdc` with YAML frontmatter for `description`, `globs`, and `alwaysApply`. See [Project rules](https://cursor.com/docs/context/rules). |
| **`mcp.json`** | **Project MCP servers** — same JSON shape as global MCP config; tools scoped to this repo. See [MCP → Configuration locations](https://cursor.com/docs/mcp.md). |
| **`.cursor/skills/`** | **Project skills** (Cursor’s default folder for them) — each subfolder with a `SKILL.md` follows the [Agent Skills](https://cursor.com/docs/skills.md) layout. **This repo** does not use this path; it uses workspace root [`skills/`](../skills/) instead (see the **Skills in this repository** callout at the top of this file). |
| **`hooks.json`** | **Hooks** — wires Agent/Tab lifecycle events to commands (for example after file edits or before shell commands). See [Hooks](https://cursor.com/docs/hooks.md). |
| **`hooks/`** | **Hook scripts** — executable helpers referenced from `hooks.json` (for example `.cursor/hooks/format.sh`). Not special by name; this layout matches Cursor’s examples. |

Files such as **`README.md`** here are **not** configuration — they are for humans only.

### What this repository uses

Only **`rules/`** and this **`README.md`** are committed under `.cursor/`. There is **no** **`.cursor/skills/`** directory — skills live in **[`skills/`](../skills/)** at the repo root. Nothing else is required under `.cursor/` for Cursor to work with the project.

**Skills path:** [`.vscode/settings.json`](../.vscode/settings.json) sets `"chat.agentSkillsLocations": { "skills/": true }` so Cursor loads skills from that workspace folder (not from `.cursor/skills/`). You can still add **`.cursor/mcp.json`** or **`hooks.json`** later without changing the skills layout.

## Project rules vs skills

Both steer the model, but they are different layers (skills paths for this repo are summarized at the **top of this file**):

| | **Cursor rules** (`.cursor/rules/`) | **Skills** (`skills/*/SKILL.md`) |
| --- | --- | --- |
| **Purpose** | **Routing**: when to attach instructions (`globs`, `alwaysApply`), plus pointers into the shared system. | **Portable task guidance**: what to do, key patterns, links to docs and workflows. |
| **Format** | Markdown with optional YAML **frontmatter** in `.mdc` files (see below). | `SKILL.md` with frontmatter `name` + `description` (and a line-count budget; see `skills/write-skill/SKILL.md`). |
| **Discovery** | Cursor injects or offers rules from `.cursor/rules/` per frontmatter and UI mode. | **Here:** workspace `skills/` (see `chat.agentSkillsLocations` in `.vscode/settings.json`). Cursor’s built-in defaults also scan `.cursor/skills/` and other paths if you add them. |
| **Canonical content** | Do **not** duplicate long rule lists — point at `docs/ai/rules.md`, `AGENTS.md`, and the right `agents/*.agent.md` / skill. | Holds reusable instructions; deep-link to `docs/` and `.agent/workflows/` for long procedures. |

**Rule of thumb:** change policy or procedures in **`docs/ai/rules.md`**, **`skills/`**, or **`agents/`** first; update a `.mdc` rule when you need Cursor-specific attachment behavior (for example scoping to `*.tsx` via `globs`).

## `.mdc` rule frontmatter (summary)

- **`description`** — Short label; used for agent-selected rules and the UI.
- **`globs`** — Optional path patterns; the rule can attach when matching files are in context.
- **`alwaysApply`** — If `true`, the rule applies broadly; if `false`, Cursor uses description, globs, and/or manual `@` mention depending on rule type.

See [Project rules](https://cursor.com/docs/context/rules) for the current rule types and behavior.

## Outside this folder (still easy to confuse)

| Location | Role |
| --- | --- |
| **`AGENTS.md`** (repo root or nested) | Plain agent instructions Cursor loads alongside project rules. This repo uses root `AGENTS.md` for shared workflow and safety. |
| **`.vscode/settings.json`** | `chat.agentSkillsLocations` and `chat.agentFilesLocations` — where **skills** and **custom agent** files live in *this* workspace (`skills/`, `agents/`). |
| **`.cursorignore`** (repo root) | Excludes paths from Cursor indexing — not inside `.cursor/`. |
| **`.cursorrules`** (repo root) | Legacy single-file rules; this project uses **`.cursor/rules/*.mdc`** instead. |

## User-level `~/.cursor/` (global, not in the repo)

On your machine, Cursor also uses files under **`~/.cursor/`**, for example:

| Path | Role |
| --- | --- |
| **`~/.cursor/mcp.json`** | Global MCP servers (project `.cursor/mcp.json` overrides or adds per-repo, per [MCP](https://cursor.com/docs/mcp.md)). |
| **`~/.cursor/hooks.json`** | User-wide hooks; project `.cursor/hooks.json` is scoped to one repo ([Hooks](https://cursor.com/docs/hooks.md)). |
| **`~/.cursor/permissions.json`** | Tool approval defaults (see [permissions](https://cursor.com/docs/reference/permissions.md) in Cursor docs). |
| **`~/.cursor/plugins/local/`** | Local plugin folders for development ([Plugins](https://cursor.com/docs/plugins.md)). |

## Plugins (marketplace / local packages)

Distributable **plugins** use a manifest at **`.cursor-plugin/plugin.json`** on the **plugin root**, plus bundled `rules/`, `skills/`, `mcp.json`, hooks, etc. That is a package layout for publishing or `~/.cursor/plugins/local/`, not something this app repo must contain. See [Plugins](https://cursor.com/docs/plugins.md).

## See also

- [`docs/ai/ai-system.md`](../docs/ai/ai-system.md) — Cross-tool layout (Copilot, Claude, Cursor, etc.).
- [`AGENTS.md`](../AGENTS.md) — Workflow and guardrails for agents in this repo.
