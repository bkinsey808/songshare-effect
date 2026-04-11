# AI System

This document explains the full AI-system layout for SongShare Effect. Read it
when you are adding a new tool adapter, changing shared agent guidance, or
trying to understand which files matter to Copilot, Claude, Codex,
Antigravity, Cursor, and Gemini.

The main idea is simple: keep one shared source of truth, then add the
smallest possible amount of tool-specific wiring around it.

## Table of Contents

- [Purpose](#purpose)
- [Design Principles](#design-principles)
- [Shared Layers](#shared-layers)
- [Directory Map](#directory-map)
- [Tool Matrix](#tool-matrix)
- [Copilot](#copilot)
- [Claude](#claude)
- [Codex](#codex)
- [Antigravity](#antigravity)
- [Cursor](#cursor)
  - [`.cursor/rules/*.mdc`](#cursor-rules-mdc)
  - [`.vscode/settings.json`](#vscode-settings-json)
  - [`.cursor/README.md`](#cursor-readme)
- [Gemini](#gemini)
- [Shared Custom Agents](#shared-custom-agents)
- [Skills](#skills)
- [GitHub-Native Vs Tool-Specific `.github/`](#github-native-vs-tool-specific-github)
- [How To Change The AI System](#how-to-change-the-ai-system)
  - [Change a repo-wide coding rule](#change-a-repo-wide-coding-rule)
  - [Add reusable task guidance](#add-reusable-task-guidance)
  - [Add a focused custom-agent mode](#add-a-focused-custom-agent-mode)
  - [Add Copilot-only wiring](#add-copilot-only-wiring)
  - [Add Claude-only wiring](#add-claude-only-wiring)
  - [Add Gemini-only wiring](#add-gemini-only-wiring)
  - [Add Cursor-only attachment or routing behavior](#add-cursor-only-attachment-or-routing-behavior)
  - [Add Antigravity or workflow-automation playbooks](#add-antigravity-or-workflow-automation-playbooks)
  - [Add GitHub automation](#add-github-automation)
- [Validation](#validation)
  - [Markdown Validation Scope](#markdown-validation-scope)
  - [Textlint Config Split](#textlint-config-split)
  - [Link Validation](#link-validation)
  - [Practical Boundary Between Checks](#practical-boundary-between-checks)
- [See Also](#see-also)

---

<a id="purpose"></a>

## Purpose

The AI system in this repository has two jobs:

1. Give every coding assistant the same core project rules.
2. Let each tool keep its own adapter layer without duplicating the rules.

That means this repo intentionally separates:

- shared instructions
- reusable task guidance
- reusable custom-agent prompts
- tool-specific adapter files
- tool-specific automation or workflow playbooks

Not every file is loaded by every tool. Some files are shared across tools, and
some only matter to one integration.

---

<a id="design-principles"></a>

## Design Principles

Keep these principles intact when changing the system:

- Shared rules belong in one place, not copied into every adapter.
- Tool-specific files should mostly point back to shared files.
- Reusable task guidance belongs in `skills/`.
- Reusable custom agent prompts belong in `agents/`.
- Tool-specific automation should stay in the tool-specific area that needs it.
- If a rule changes, update the shared layer first.
- If an adapter disagrees with the shared layer, the shared layer wins.

---

<a id="shared-layers"></a>

## Shared Layers

The cross-tool shared system has four main layers:

1. `AGENTS.md`
   This is the repo-wide entry point for AI coding agents. It explains
   workflow, safety, and where to read next.
2. `docs/ai/rules.md`
   This is the canonical coding-rules reference.
3. `skills/*/SKILL.md`
   These are reusable task guides. They answer questions like "when this task
   happens, what should the agent load and what are the key constraints?"
4. `agents/*.agent.md`
   These are reusable custom-agent prompts and hook definitions for focused task
   modes such as TypeScript, Playwright, comments, and unit tests.

These four layers are the shared source of truth for the repo.

In this repository, shared skills are intended for:

- Copilot
- Claude
- Codex
- Antigravity
- Cursor
- Gemini

Antigravity also uses the shared `skills/*/SKILL.md` tree. What is different is
that it has an additional workflow-playbook layer under `.agent/workflows/*.md`
for detailed, multi-step execution procedures.

In this repository, shared custom agents are intended for:

- Copilot
- Claude
- Codex
- Antigravity
- Cursor
- Gemini

Tool-specific files should mainly do one of three things:

- point at the shared layers above
- add tool-only metadata or attachment behavior
- add tool-only automation that the shared files cannot express

Tool-specific automation is part of the overall AI system, but it is not part
of the shared source-of-truth layer.

---

<a id="directory-map"></a>

## Directory Map

This table is the fastest way to orient yourself:

| Path | Role | Shared Or Tool-Specific |
| --- | --- | --- |
| `AGENTS.md` | Repo-wide AI entry point | Shared |
| `docs/ai/rules.md` | Canonical coding rules | Shared |
| `skills/*/SKILL.md` | Reusable task guidance | Shared |
| `agents/*.agent.md` | Reusable custom-agent prompts | Shared |
| `agents/scripts/*` | Helper scripts used by shared custom agents and hooks | Shared |
| `.github/copilot-instructions.md` | Copilot adapter | Tool-specific |
| `CLAUDE.md` | Claude adapter | Tool-specific |
| `GEMINI.md` | Gemini adapter | Tool-specific |
| `.cursor/rules/*.mdc` | Cursor project-rule adapters | Tool-specific |
| `.cursor/README.md` | Human-facing explanation of Cursor wiring | Tool-specific docs |
| `.vscode/settings.json` | Workspace settings that tell Cursor where skills and custom agents live | Tool-specific wiring |
| `.agent/workflows/*.md` | Antigravity and workflow-playbook files used by repo-specific agent workflows | Tool-specific |
| `.agent/README.md` | Human-facing explanation of `.agent/` | Tool-specific docs |
| `.github/workflows/*.yml` | GitHub Actions, not AI instructions | GitHub-native |
| `.github/README.md` | Explains what under `.github/` is GitHub-native vs adapter-only | Human-only docs |

Important absence cases in the current repo:

- There is no `CODEX.md`.
- There is no `.cursor/skills/`.
- There is no committed Antigravity-specific rules file under `.agent/`.
- There is no committed `.agent/config.yaml`.

Those absences are part of the design, not an accident.

---

<a id="tool-matrix"></a>

## Tool Matrix

| Tool | Main Repo Entry Files | Tool-Specific Behavior In This Repo |
| --- | --- | --- |
| Copilot | `AGENTS.md`, `docs/ai/rules.md`, `skills/`, `agents/`, `.github/copilot-instructions.md` | Uses shared skills and shared custom agents through a thin adapter under `.github/` |
| Claude | `AGENTS.md`, `docs/ai/rules.md`, `skills/`, `agents/`, `CLAUDE.md` | Uses shared skills and shared custom agents through a thin root adapter file |
| Codex | `AGENTS.md`, `docs/ai/rules.md`, `skills/`, `agents/` | Uses shared skills and shared custom agents directly; no dedicated repo adapter file is committed |
| Antigravity | `AGENTS.md`, `docs/ai/rules.md`, `skills/`, `.agent/workflows/*.md`, `.agent/README.md` | Uses shared skills plus `.agent/workflows/` playbooks with slash-command and `// turbo` semantics |
| Cursor | Shared layers plus `.cursor/rules/*.mdc`, `.cursor/README.md`, `.vscode/settings.json` | Uses shared skills and shared custom agents through `.mdc` rule attachment plus workspace settings |
| Gemini | `AGENTS.md`, `docs/ai/rules.md`, `skills/`, `agents/`, `GEMINI.md` | Uses shared skills and shared custom agents through a thin root adapter file |

The practical takeaway is that all tools share the same core guidance, but they
do not all load it through the same filenames.

---

<a id="copilot"></a>

## Copilot

GitHub Copilot's repo-specific adapter is
[`/.github/copilot-instructions.md`](/.github/copilot-instructions.md).

In this repo, Copilot should use:

- [`AGENTS.md`](/AGENTS.md) for repo workflow and guardrails
- [`docs/ai/rules.md`](/docs/ai/rules.md) for canonical coding rules
- this document for the layout of the system
- `skills/*/SKILL.md` and `agents/*.agent.md` for task-specific shared guidance

The Copilot adapter is intentionally thin. It should not become a second source
of truth.

What belongs in the Copilot adapter:

- "read these shared files first"
- small Copilot-only notes that cannot live elsewhere

What does not belong there:

- duplicated coding rules
- large examples
- full task procedures that should live in `skills/`, `agents/`, or `docs/`

The `.github/` directory has mixed semantics in this repo. GitHub Actions uses
`.github/workflows/`, but `.github/copilot-instructions.md` is a Copilot
adapter, not a GitHub Actions file. See
[`/.github/README.md`](/.github/README.md) for that distinction.

---

<a id="claude"></a>

## Claude

Claude's adapter is [`/CLAUDE.md`](/CLAUDE.md).

This file is intentionally short and says so explicitly. Its role is to add the
smallest possible amount of Claude-specific guidance on top of the shared
system.

Today it adds a few Claude-specific reminders:

- always run `npm run lint` from the project root
- do not use `npx eslint` directly
- add JSDoc to new hook files
- read the unit-test skills before writing tests

Everything else should still come from the shared system:

- [`AGENTS.md`](/AGENTS.md)
- [`docs/ai/rules.md`](/docs/ai/rules.md)
- [`skills/`](/skills)
- [`agents/`](/agents)

If Claude needs more reusable guidance, add it to the shared layer first and
only keep the Claude adapter as an entry point.

---

<a id="codex"></a>

## Codex

Codex does not currently have a committed repo-specific adapter file such as
`CODEX.md`.

That is an intentional shape the repo can support well:

- Codex should start from [`AGENTS.md`](/AGENTS.md).
- Codex should treat [`docs/ai/rules.md`](/docs/ai/rules.md) as canonical.
- Codex should load `skills/*/SKILL.md` for recurring task guidance.
- Codex should use `agents/*.agent.md` when a focused shared custom-agent prompt
  is relevant.

This means Codex is expected to consume the shared system directly rather than
through a Codex-only wrapper file.

If a Codex-specific adapter is added later, it should follow the same rule as
the others:

- keep it thin
- point back to shared files
- do not duplicate large rule lists

---

<a id="antigravity"></a>

## Antigravity

Antigravity's repo-specific area is [`/.agent/`](/.agent).

The committed files there today are:

- [`/.agent/README.md`](/.agent/README.md)
- [`/.agent/workflows/add-api-endpoint.md`](/.agent/workflows/add-api-endpoint.md)
- [`/.agent/workflows/add-component.md`](/.agent/workflows/add-component.md)
- [`/.agent/workflows/commit-code.md`](/.agent/workflows/commit-code.md)
- [`/.agent/workflows/database-migrations.md`](/.agent/workflows/database-migrations.md)
- [`/.agent/workflows/deploy.md`](/.agent/workflows/deploy.md)
- [`/.agent/workflows/lint-and-format.md`](/.agent/workflows/lint-and-format.md)
- [`/.agent/workflows/run-dev-servers.md`](/.agent/workflows/run-dev-servers.md)
- [`/.agent/workflows/run-tests.md`](/.agent/workflows/run-tests.md)
- [`/.agent/workflows/troubleshoot.md`](/.agent/workflows/troubleshoot.md)
- [`/.agent/workflows/update-schema.md`](/.agent/workflows/update-schema.md)

In this repo, `.agent/workflows/*.md` are not the canonical coding rules. They
are detailed execution playbooks.

The repo's `.agent/README.md` describes three notable Antigravity-specific
ideas:

- workflow files can be exposed as slash-command-like playbooks
- `// turbo` markers can authorize certain routine steps for autonomous
  execution
- the workflow file itself is meant to be followed linearly as a mission
  playbook

Important current-state detail:

- `.agent/workflows/` is committed and active
- an Antigravity-specific rules file is not currently committed
- `.agent/config.yaml` is not currently committed

So for Antigravity in this repo:

- shared coding rules still live in [`docs/ai/rules.md`](/docs/ai/rules.md)
- shared task guidance still lives in [`/skills/`](/skills)
- the `.agent/` directory adds workflow automation semantics on top

---

<a id="cursor"></a>

## Cursor

Cursor's repo-specific area is [`/.cursor/`](/.cursor).

There are three important pieces to understand:

1. `.cursor/rules/*.mdc`
2. `.cursor/README.md`
3. `.vscode/settings.json`

<a id="cursor-rules-mdc"></a>

### `.cursor/rules/*.mdc`

These are Cursor project-rule files. In this repo they are used as routing and
attachment wrappers, not as the canonical home for project rules.

Current committed Cursor rules:

- [`comment-agent.mdc`](/.cursor/rules/comment-agent.mdc)
- [`lint-resolution-agent.mdc`](/.cursor/rules/lint-resolution-agent.mdc)
- [`playwright-agent.mdc`](/.cursor/rules/playwright-agent.mdc)
- [`typescript-agent.mdc`](/.cursor/rules/typescript-agent.mdc)
- [`unit-test-agent.mdc`](/.cursor/rules/unit-test-agent.mdc)

Each of these files follows the same pattern:

- define Cursor-specific frontmatter such as `description`, `globs`, and
  `alwaysApply`
- tell Cursor which shared files to load
- route the work into a shared skill or shared custom-agent file

That is why the Cursor rule files are small. They attach; they do not try to be
the source of truth.

<a id="vscode-settings-json"></a>

### `.vscode/settings.json`

This workspace settings file is part of Cursor wiring in this repo because it
declares where shared AI files live:

- `"chat.agentSkillsLocations": { "skills/": true }`
- `"chat.agentFilesLocations": { "agents/": true }`
- `"chat.useCustomAgentHooks": true`

That means this repo intentionally uses:

- root `skills/` instead of `.cursor/skills/`
- root `agents/` instead of a Cursor-only custom-agent location

This is one of the most important AI-system decisions in the repo. It keeps
Cursor aligned with the shared cross-tool layout instead of creating a separate
Cursor-only skills tree.

<a id="cursor-readme"></a>

### `.cursor/README.md`

This README explains the Cursor-specific layout and warns about common points of
confusion:

- `.cursor/rules/` is real Cursor configuration
- `.cursor/skills/` is a real Cursor convention, but this repo does not use it
- `AGENTS.md`, `skills/`, and `agents/` are still the important shared layers

Cursor in this repo should therefore be understood as:

- shared rules and shared content first
- `.mdc` files for attachment and routing
- workspace settings to tell Cursor where the shared content lives

---

<a id="gemini"></a>

## Gemini

Gemini's adapter is [`/GEMINI.md`](/GEMINI.md).

It follows the same thin-adapter pattern as Copilot and Claude:

- read [`AGENTS.md`](/AGENTS.md)
- treat [`docs/ai/rules.md`](/docs/ai/rules.md) as canonical
- read this document for cross-tool layout
- load task-specific guidance from `skills/*/SKILL.md` and `agents/*.agent.md`

It also records a small amount of tool-local context:

- local frontend development uses `https://127.0.0.1:5173`
- the API dev server runs on `http://localhost:8787`

If more reusable Gemini guidance is ever needed, it should usually move into
the shared system first.

---

<a id="shared-custom-agents"></a>

## Shared Custom Agents

Shared custom-agent prompts live under [`/agents/`](/agents).

In this repo, the shared `agents/` tree is intended for:

- Copilot
- Claude
- Codex
- Antigravity
- Cursor
- Gemini

Current committed agent files:

- [`Code Comment Agent.agent.md`](/agents/Code%20Comment%20Agent.agent.md)
- [`Playwright Agent.agent.md`](/agents/Playwright%20Agent.agent.md)
- [`TypeScript Agent.agent.md`](/agents/TypeScript%20Agent.agent.md)
- [`Unit Test Agent.agent.md`](/agents/Unit%20Test%20Agent.agent.md)

These files are shared assets, not Cursor-only or Codex-only prompts. They are
intended to be reused across the tools listed above anywhere a tool can load a
focused agent or prompt file.

The `agents/scripts/` directory contains helper scripts used by those shared
agents and their hooks:

- [`block-dangerous-commands.bun.ts`](/agents/scripts/block-dangerous-commands.bun.ts)
- [`unit-test-agent-guard.bun.ts`](/agents/scripts/unit-test-agent-guard.bun.ts)

Use `agents/*.agent.md` when the task benefits from a bounded persona or tool
policy. Use `skills/` when the task needs reusable procedural guidance.

---

<a id="skills"></a>

## Skills

Shared skills live under [`/skills/`](/skills). They are the reusable,
tool-agnostic task layer of the AI system.

In this repo, the shared `skills/` tree is intended for:

- Copilot
- Claude
- Codex
- Antigravity
- Cursor
- Gemini

Antigravity uses the shared `skills/` tree too, but also has an additional
workflow layer under `.agent/workflows/`.

Skills should answer questions like:

- when should this guidance be used
- what must be checked first
- what other docs or skills should be loaded
- what are the sharp edges for this task

Skills are not meant to be giant encyclopedias. For long-form reference:

- use normal docs under `docs/`
- use `.agent/workflows/` for Antigravity-specific or workflow-engine playbooks

This repo deliberately uses root `skills/` as the shared skills location. Do
not create a second skills tree under `.cursor/skills/` unless you explicitly
want Cursor-only skills that diverge from the shared system.

---

<a id="github-native-vs-tool-specific-github"></a>

## GitHub-Native Vs Tool-Specific `.github/`

The `.github/` directory is easy to misunderstand, so it deserves a dedicated
note in the AI-system documentation.

Under `.github/` in this repo:

- `.github/workflows/*.yml` are GitHub-native GitHub Actions workflows
- `.github/copilot-instructions.md` is a Copilot adapter, not a GitHub Actions
  file
- `.github/README.md` is human documentation
- `.github/hooks/` is repo-specific local-tooling configuration, not a
  GitHub-native directory

So "under `.github/`" does not automatically mean "special to GitHub itself."

See [`/.github/README.md`](/.github/README.md) for the directory-specific
breakdown.

---

<a id="how-to-change-the-ai-system"></a>

## How To Change The AI System

Use this decision guide when updating the system:

<a id="change-a-repo-wide-coding-rule"></a>

### Change a repo-wide coding rule

Update:

- [`docs/ai/rules.md`](/docs/ai/rules.md)

Then update tool adapters only if they need different entry-point wording.

<a id="add-reusable-task-guidance"></a>

### Add reusable task guidance

Update or create:

- `skills/<name>/SKILL.md`
- a companion doc under `docs/` if the topic needs long-form reference

<a id="add-a-focused-custom-agent-mode"></a>

### Add a focused custom-agent mode

Update or create:

- `agents/<Name>.agent.md`
- `agents/scripts/*` if hooks or helper scripts are required

<a id="add-copilot-only-wiring"></a>

### Add Copilot-only wiring

Update:

- [`/.github/copilot-instructions.md`](/.github/copilot-instructions.md)

<a id="add-claude-only-wiring"></a>

### Add Claude-only wiring

Update:

- [`/CLAUDE.md`](/CLAUDE.md)

<a id="add-gemini-only-wiring"></a>

### Add Gemini-only wiring

Update:

- [`/GEMINI.md`](/GEMINI.md)

<a id="add-cursor-only-attachment-or-routing-behavior"></a>

### Add Cursor-only attachment or routing behavior

Update:

- `.cursor/rules/*.mdc`
- possibly [`.vscode/settings.json`](/.vscode/settings.json) if the skills or
  agent roots need to move

Do not create Cursor-only duplicates of shared rules unless absolutely
necessary.

<a id="add-antigravity-or-workflow-automation-playbooks"></a>

### Add Antigravity or workflow-automation playbooks

Update:

- `.agent/workflows/*.md`

Do not move shared coding rules into `.agent/workflows/`.

<a id="add-github-automation"></a>

### Add GitHub automation

Update:

- `.github/workflows/*.yml`

That is GitHub Actions infrastructure, not AI instructions.

---

<a id="validation"></a>

## Validation

Use these checks after changing the AI system:

```bash
npm run check:ai-system
npm run check:skill-line-count
npm run check:links
npm run check:md
```

What they catch:

- `check:ai-system`
  Checks shared guidance files for stale migration paths and agent frontmatter
  issues.
- `check:skill-line-count`
  Ensures skills and agent prompts stay concise.
- `check:links`
  Catches broken internal links across docs, skills, agents, `.agent/`, and
  `.github/`.
- `check:md`
  Runs markdown linting and text checks over the AI-system docs as well as
  other repo docs.

If you move paths, rename files, or add new adapter layers, run these checks in
the same change.

<a id="markdown-validation-scope"></a>

### Markdown Validation Scope

The markdown and AI-doc linting pipeline is split across `lint`,
`check:md`, and `check:links`:

- `npm run lint` includes `npm run check:md` and `npm run check:ai-system`
  after the TypeScript and JavaScript linters.
- `npm run check:md` runs `textlint` over multiple markdown groups with
  different configs.
- `npm run check:links` runs `remark` over the repo's markdown and instruction
  files to validate internal links and anchors.

<a id="textlint-config-split"></a>

### Textlint Config Split

`check:md` is intentionally split into three `textlint` passes:

1. General markdown with the default config:
   - `docs/**/*.md`
   - `.agent/**/*.md`
   - `supabase/**/*.md`
   - `react/**/*.md`
   - `types/**/*.md`
   - `skills/**/REFERENCE.md`
2. Skills and shared agent prompts with `.textlintrc.skills.json`:
   - `skills/*/SKILL.md`
   - `agents/**/*.md`
3. Instruction and adapter files with `.textlintrc.instructions.json`:
   - `.github/copilot-instructions.md`
   - `AGENTS.md`
   - `CLAUDE.md`
   - `GEMINI.md`

Today, these configs mainly enforce line-count budgets:

- `.textlintrc.json`: max 1000 lines for general markdown
- `.textlintrc.skills.json`: max 300 lines for skills and shared custom-agent
  prompts
- `.textlintrc.instructions.json`: max 150 lines for top-level instruction and
  adapter files

This split is important because the repo intentionally holds different document
types to different size budgets.

<a id="link-validation"></a>

### Link Validation

`check:links` uses `remark` across:

- `docs/**/*.md`
- `.agent/**/*.md`
- `skills/**/*.md`
- `agents/**/*.md`
- `.github/*.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

The default remark config in `.remarkrc.mjs` does three important things:

- validates internal links with `remark-validate-links`
- treats explicit HTML anchors like `<a id="...">` as valid fragment targets
- rejects `file:` links and requires root-relative markdown links instead

`check:links:external` uses `.remarkrc.external.mjs`, which adds
`remark-lint-no-dead-urls` for external URL checking. That external check skips
some known local or dashboard-style URLs such as `localhost`, `127.0.0.1`, and
`dash.cloudflare.com`.

<a id="practical-boundary-between-checks"></a>

### Practical Boundary Between Checks

Use this rule of thumb:

- `check:md` verifies markdown prose files fit the repo's textlint budgets.
- `check:links` verifies markdown links, fragments, and link style.
- `check:ai-system` verifies the structure and path conventions of the AI system
  itself.

If you touched AI docs, adapter files, skills, `.agent/`, or `agents/`, you
usually want all three.

---

<a id="see-also"></a>

## See Also

- [AGENTS.md](/AGENTS.md)
- [docs/ai/rules.md](/docs/ai/rules.md)
- [.github/README.md](/.github/README.md)
- [.cursor/README.md](/.cursor/README.md)
- [.agent/README.md](/.agent/README.md)
- [README.md](/README.md)
- [docs/doc-best-practices.md](/docs/doc-best-practices.md)
- [docs/skill-best-practices.md](/docs/skill-best-practices.md)
