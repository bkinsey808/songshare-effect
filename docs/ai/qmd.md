# QMD — Skill and Doc Search

QMD is a local CLI search engine for markdown files. In this project it indexes
`skills/` and `docs/` so that AI agents and developers can find relevant
guidance without loading every file into context.

Read this when you are:

- searching for skill or doc files relevant to a task
- maintaining the QMD index after adding or changing files
- configuring or debugging the Claude Code hook
- configuring or debugging Cursor hooks and skills paths

## Table of Contents

- [Why QMD](#why-qmd)
- [Collections](#collections)
- [Commands](#commands)
  - [search — BM25 Keyword Search](#search)
  - [vsearch — Vector Search](#vsearch)
  - [query — Hybrid Search with Reranking](#query)
  - [get — Fetch a File or Snippet](#get)
  - [Status and Maintenance](#status-and-maintenance)
- [npm run qmd](#npm-run-qmd)
- [Claude Code Hook](#claude-code-hook)
- [Other Tools](#other-tools)
- [Cursor](#cursor)
- [Gemini and Antigravity](#gemini-and-antigravity)
- [When to Re-embed](#when-to-re-embed)
- [Limitations: WSL2 + Intel Arc](#limitations)
  - [Why GPU Is Not Available](#why-gpu-is-not-available)
  - [cmake Noise](#cmake-noise)

---

<a id="why-qmd"></a>

## Why QMD

This project has 40+ skill files and 36+ doc files. Without search, an agent
either loads everything (wasteful) or relies on a human to name the right file.
QMD solves this: given a task description it returns the most relevant files,
so only those get loaded into context.

It runs fully locally — no API key, no network call for search.

---

<a id="collections"></a>

## Collections

Two collections are indexed:

| Name | Path | Contents |
| --- | --- | --- |
| `skills` | `skills/` | Reusable task guidance for AI agents — Hono, Effect-TS, React, Zustand, Supabase, Playwright, unit tests, linting, and more |
| `docs` | `docs/` | Project documentation — architecture, coding rules, auth system, deployment, AI system layout, and developer workflows |

To see what is indexed:

```bash
npm run qmd -- ls skills
npm run qmd -- ls docs
npm run qmd -- status
```

---

<a id="commands"></a>

## Commands

<a id="search"></a>

### `search` — BM25 Keyword Search

Fast. No model. No GPU needed. Use this for task-oriented queries where the
technical terms appear in the skill files.

```bash
npm run qmd -- search "add hono api endpoint"
npm run qmd -- search "effect-ts tagged error"
npm run qmd -- search "zustand store pattern"
npm run qmd -- search "playwright login test"
npm run qmd -- search "unit test hook"

# Filter to one collection
npm run qmd -- search "auth flow" --collection skills
npm run qmd -- search "auth flow" --collection docs

# More results
npm run qmd -- search "realtime rls" -n 10

# Show all results regardless of score
npm run qmd -- search "authentication" --all

# Just file paths (useful for scripting)
npm run qmd -- search "supabase client" --files
```

**When BM25 works well:** queries that use the exact terms found in the skill
files — "hono endpoint", "effect-ts", "zustand". Scores of 75%+ indicate a
strong match.

**When BM25 struggles:** natural language questions ("how does authentication
work") or queries where the important concepts are described with different
words than the docs use. In those cases the right files often exist but rank
below the default display threshold. Use `--all` or a more specific query.

<a id="vsearch"></a>

### `vsearch` — Vector Search

Uses the local embedding model to find semantically similar content. Handles
natural language questions better than BM25. Returns the right files even when
the query words don't exactly match the document words.

```bash
npm run qmd -- vsearch "how does authentication work"
npm run qmd -- vsearch "error handling patterns"
```

**Speed on this machine:** very slow — the embedding model runs on CPU (Intel
Arc 140V is not exposed to WSL2 via Vulkan). Expect several minutes per query.
Only use `vsearch` interactively when BM25 gives poor results and you are
willing to wait.

**The embedding model** (`hf_ggml-org_embeddinggemma-300M-Q8_0.gguf`, 314 MB)
is stored at `~/.cache/qmd/models/` and is the same model used by `qmd embed`.

<a id="query"></a>

### `query` — Hybrid Search with Reranking

Combines BM25 + vector + LLM query expansion. Highest quality results. Requires
the 1.28 GB query expansion model (`hf_tobil_qmd-query-expansion-1.7B-q4_k_m.gguf`).

**Not practical on this machine.** Running a 1.28B parameter model on CPU takes
6+ minutes per query. Do not use `qmd query` interactively.

If GPU acceleration becomes available (e.g. after setting up Intel Arc via
Vulkan in WSL2, or switching to a machine with CUDA), `qmd query` would become
the best search mode.

<a id="get"></a>

### `get` — Fetch a File or Snippet

Retrieve the full content of a file returned by a search result:

```bash
npm run qmd -- get "skills/hono-best-practices/SKILL.md"
npm run qmd -- get "docs/auth/authentication-system.md"

# Fetch from a specific line
npm run qmd -- get "skills/hono-best-practices/SKILL.md:35" -l 30
```

The file path shown in search results (e.g.
`qmd://skills/hono-best-practices/skill.md:13`) maps directly to `get`.

<a id="status-and-maintenance"></a>

### Status and Maintenance

```bash
# Check collection health and pending embeddings
npm run qmd -- status

# Re-index after editing files (updates BM25 index, marks stale chunks)
npm run qmd -- update

# Regenerate vector embeddings for changed chunks
npm run qmd -- embed

# Free up cache and vacuum the database
npm run qmd -- cleanup
```

---

<a id="npm-run-qmd"></a>

## npm run qmd

Always use `npm run qmd --` instead of `./node_modules/.bin/qmd` directly.

The npm script runs `scripts/qmd.sh`, which suppresses the cmake/Vulkan build
noise that `node-llama-cpp` emits on stderr and stdout when it fails to find
GPU support. Without the wrapper, every invocation prints several hundred lines
of cmake output before the actual results.

```bash
# Do this
npm run qmd -- search "hono endpoint"

# Not this (noisy)
./node_modules/.bin/qmd search "hono endpoint"
```

---

<a id="claude-code-hook"></a>

## Claude Code Hook

Claude Code runs `qmd search` automatically on every user prompt via a
`UserPromptSubmit` hook in [`.claude/settings.json`](/.claude/settings.json).

The hook script is [`.claude/hooks/qmd-context.sh`](/.claude/hooks/qmd-context.sh):

1. Reads the user's prompt from stdin JSON
2. Runs `qmd search` against the `skills` and `docs` collections
3. Returns matching excerpts as `additionalContext` — injected into Claude's
   context before it responds

This means Claude automatically sees the relevant skill and doc files for
task-oriented prompts without being told which ones to load.

**What fires the hook well:** task prompts with technical terms —
`"add a new Hono endpoint"`, `"write a unit test for useAuth"`,
`"fix the zustand store"`. These match BM25 with 75–85% scores.

**What does not fire the hook:** conversational messages, questions without
technical keywords, and short follow-ups. These return "No results found" in
the hook context — which is expected and correct.

**The hook uses `search`, not `vsearch`** — BM25 runs in ~1.5 seconds.
`vsearch` would take 6+ minutes and is not viable as an automated hook on
this machine.

---

<a id="other-tools"></a>

## Other Tools

**Repository standard:** Workspace hooks for **GitHub Copilot and Cursor** are
defined **only** under [`.github/hooks/`](/.github/hooks/). Both tools read
`chat.useCustomAgentHooks` in [`.vscode/settings.json`](/.vscode/settings.json)
and use the same JSON files — this repo does **not** maintain a parallel copy
under `.cursor/hooks.json` for shared behavior (see [Cursor](#cursor)).

Copilot and Cursor use the VS Code hook system: `chat.useCustomAgentHooks` and
workspace hooks from `.github/hooks/*.json`.

This repo commits two QMD hooks in that shared location:

- `.github/hooks/qmd-session-context.json` runs on `SessionStart`
- it calls `agents/scripts/qmd-session-start-context.bun.ts`
- it injects stable QMD usage guidance into Copilot and Cursor sessions
- `.github/hooks/qmd-user-prompt-context.json` runs on `UserPromptSubmit`
- it calls `agents/scripts/qmd-user-prompt-context.bun.ts`
- it runs a filtered, compact `qmd search` experiment for task-shaped prompts

This means Claude-style prompt-time QMD context injection is now **proven** to
work in Copilot and Cursor for this repo, not just theoretically supported by the docs.
The current Copilot/Cursor implementation is still more conservative than the
Claude Code hook:

- it filters out meta and conversational prompts
- it rewrites some natural-language prompts into better QMD queries
- it injects a compact result summary instead of raw search excerpts

`AGENTS.md` should still instruct agents to run `qmd search` manually when they
need broader or more precise retrieval than the hook provides:

```bash
npm run qmd -- search "<task description>"
```

The agent then loads only the returned skill and doc files.

Gemini, Codex, and Antigravity still rely on the manual `qmd search` workflow.
Cursor-specific wiring (skills location, optional Claude hooks, duplicate
injection) is covered in [Cursor](#cursor).

---

<a id="cursor"></a>

## Cursor

**Standard:** Cursor uses the **same** [`.github/hooks/`](/.github/hooks/)
definitions as Copilot for QMD and other shared agent hooks — not a separate
`.cursor/hooks.json` copy. Enable `chat.useCustomAgentHooks` in
[`.vscode/settings.json`](/.vscode/settings.json).

The QMD hooks (`qmd-session-context.json` on `SessionStart`,
`qmd-user-prompt-context.json` on `UserPromptSubmit`) run the Bun scripts in
`agents/scripts/` and inject **stable guidance** at session start plus a
**filtered, compact** `qmd search` summary on **task-shaped** user prompts (not
every message — see
[`qmd-user-prompt-context.bun.ts`](/agents/scripts/qmd-user-prompt-context.bun.ts)).

**Per-prompt QMD:** yes, when that `UserPromptSubmit` hook runs and passes the
script’s filters — it is intentionally more conservative than the Claude Code
shell hook (see [Other Tools](#other-tools)).

**Skills and agents in this workspace:** Cursor reads
`chat.agentSkillsLocations` and `chat.agentFilesLocations` from
`.vscode/settings.json` (here: root [`skills/`](/skills/) and [`agents/`](/agents/),
not `.cursor/skills/`). A short map of Cursor-only adapters is in
[`.cursor/README.md`](/.cursor/README.md).

**Optional: Claude Code hooks inside Cursor:** if **Settings → Features →
Third-party skills** is on, Cursor can also load hooks from
[`.claude/settings.json`](/.claude/settings.json), including
[`qmd-context.sh`](/.claude/hooks/qmd-context.sh) on `UserPromptSubmit` (mapped
to `beforeSubmitPrompt`). That path runs **`qmd search`** with **richer
excerpt-style** `additionalContext`, closer to standalone Claude Code. See
[Third-party hooks](https://cursor.com/docs/reference/third-party-hooks) in
the Cursor docs.

**If both stacks are enabled** (custom agent hooks + third-party skills), you
may get **two** QMD-related injections on some prompts — same general goal,
different format. Use only one if it feels noisy. The **Hooks** output channel
in Cursor helps debug failures.

Manual discovery still applies:

```bash
npm run qmd -- search "<task description>"
```

---

<a id="gemini-and-antigravity"></a>

## Gemini and Antigravity

Gemini and Antigravity do not currently support automated prompt-time hooks in
this repository. Instead, they rely on explicit discovery and manual usage
patterns to ensure the right skills are loaded.

### Antigravity Workflow

Antigravity has a dedicated workflow mapped to the `/qmd` slash command. This is
the preferred way to discover skills in an Antigravity mission:

```bash
# In the chat
/qmd "add a new hono endpoint"
```

The workflow is located at [`.agent/workflows/qmd.md`](/.agent/workflows/qmd.md)
and is authorized with `// turbo` to run the search and report findings
autonomously.

### Gemini Discovery

Gemini-based agents are instructed in [`GEMINI.md`](/GEMINI.md) and
[`AGENTS.md`](/AGENTS.md) to run QMD manually as the first step of any task.
Always use the `npm run qmd --` wrapper to ensure the output is noise-free and
easy for the model to parse.

```bash
npm run qmd -- search "<task description>"
```

---

<a id="when-to-re-embed"></a>

## When to Re-embed

Run `npm run qmd -- embed` after:

- Adding a new skill file (`skills/<name>/SKILL.md`)
- Adding a new doc file under `docs/`
- Significantly rewriting an existing skill or doc

Do not re-embed for:

- Minor edits (a sentence or two) — embeddings are chunk-level; small changes
  do not materially affect search quality
- Code file changes — only `skills/` and `docs/` are indexed
- Context description changes (`qmd context add`) — context is metadata,
  not embedded

`npm run qmd -- status` shows how many chunks need embeddings. QMD also prints
a tip during `vsearch` and `query` when stale chunks are detected.

The embed model runs on CPU and takes several minutes for a full index. The
first run also downloads the 314 MB embedding model to `~/.cache/qmd/models/`.
Subsequent runs are incremental — only changed chunks are re-embedded.

---

<a id="limitations"></a>

## Limitations: WSL2 + Intel Arc

These limitations are specific to running QMD under WSL2 with an Intel Arc GPU.
On a machine with an NVIDIA GPU (CUDA), native Linux with Intel Arc, or macOS
(Metal), `vsearch` and `query` would be fast and practical.

| Limitation | Cause | Workaround |
| --- | --- | --- |
| `vsearch` takes 6+ minutes | No GPU — embedding model runs on CPU | Use `search` for interactive queries |
| `query` is impractical | 1.28B LLM on CPU | Same — use `search` |
| BM25 misses natural language queries | Keyword mismatch | Use `--all` flag or more specific technical terms |
| cmake noise without wrapper | `node-llama-cpp` tries Vulkan build on every invocation | Always use `npm run qmd --` |

<a id="why-gpu-is-not-available"></a>

### Why GPU Is Not Available

This machine has an Intel Core Ultra 7 258V with Intel Arc 140V graphics,
running under WSL2. The GPU is not accessible to `node-llama-cpp` because of a
gap in the WSL2 GPU passthrough stack for Vulkan compute:

- `/dev/dxg` exists — the Windows Intel Arc driver exposes the GPU to WSL2 via
  DXCore/D3D12.
- The Intel Arc Windows Vulkan driver (`igvk64.dll`) is present in
  `/usr/lib/wsl/drivers/` but is a Windows DLL — it cannot be loaded as a
  Linux Vulkan ICD.
- The Linux-side Intel Vulkan driver (`libvulkan_intel.so` via Mesa ANV) is
  installed but requires the `i915`/`xe` kernel module, which is not present in
  WSL2's kernel.
- Vulkan therefore falls back to `llvmpipe` (software renderer).
- Intel provides OpenCL for WSL2 (`Intel_OpenCL_ICD64.dll` is in the driver
  folder) but `node-llama-cpp` does not support OpenCL.

NVIDIA has built a first-class CUDA-over-WSL2 passthrough. Intel has not done
the equivalent for Vulkan. There is no practical path to GPU acceleration for
`node-llama-cpp` on this machine without either running native Linux (where
`i915`/`xe` works) or Intel shipping a WSL2-native Vulkan ICD.

<a id="cmake-noise"></a>

### cmake Noise

`node-llama-cpp` attempts to compile Vulkan support on every cold start and
fails because the Vulkan SDK build headers (`Vulkan_LIBRARY`, `glslc`) are not
present, even though the Vulkan runtime is installed. It does not cache this
failure. The `scripts/qmd.sh` wrapper suppresses the output with `grep -Ev`.

---

## See Also

- [docs/ai/ai-system.md](ai-system.md) — full AI system layout; QMD is documented in the Skill Discovery section
- [docs/ai/hooks.md](hooks.md) — where all AI hooks live in this repo (including QMD)
- [AGENTS.md](/AGENTS.md) — the `qmd search` convention for all tools
- [.cursor/README.md](/.cursor/README.md) — Cursor adapters (QMD hooks, skills paths, overlap with third-party skills)
- [.claude/hooks/qmd-context.sh](/.claude/hooks/qmd-context.sh) — the Claude Code hook implementation
- [scripts/qmd.sh](/scripts/qmd.sh) — the noise-filtering wrapper
- [QMD project](https://github.com/tobi/qmd) — upstream docs and changelog
