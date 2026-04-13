# .agent Directory

This directory is the repo's Antigravity-oriented workflow area. It currently
contains human-readable workflow playbooks and a README that explains how those
playbooks fit into the broader AI system.

Antigravity in this repo uses both:

- the shared `skills/` tree for domain and best-practice guidance
- `.agent/workflows/` for detailed multi-step execution playbooks

## Special Files & Directories

### 📂 [`workflows/`](./workflows/)
Detailed step-by-step "playbooks" for common repository tasks (e.g., adding an API endpoint, updating migrations).

- **Slash Commands**: Files in this directory are mapped to slash commands (e.g., `/.agent/workflows/deploy.md` handles `/deploy`).
- **Automation (`// turbo`)**: Routine commands (like linting or testing) can be annotated with `// turbo` to allow the agent to run them autonomously during a workflow.
- **Mission Execution**: When an agent loads a workflow, it follows the checklist strictly to ensure no repository-specific safety rules are skipped.

### 📄 `config.yaml` (Optional, not currently committed)
Configuration for the agent's behavior and safety policies. This is where you
would define which commands are "SafeToAutoRun."

### 📄 `rules.md` (Optional, not currently committed)
Low-level behavioral guardrails for the agent. Shared coding rules still belong
in [`docs/ai/rules.md`](/docs/ai/rules.md). If an Antigravity-specific rules
file is ever reintroduced under `.agent/`, it should stay focused on
Antigravity-specific mechanics rather than duplicating shared repo rules.

## How to Use Workflows

1. **Discovery**: Before starting any task, run `npm run qmd -- search "<task description>"` or use the `/qmd` slash command to find relevant skill and doc files. Each workflow also starts with a `description` in its YAML frontmatter, which helps the agent identify when it is relevant.
2. **Loading**: You can ask the agent to "follow the X workflow" or use a slash command.
3. **Execution**: The agent will read the file and execute the steps in sequence, reporting progress as it goes.
4. **Turbo**: For steps marked with `// turbo`, the agent will execute the command and proceed without waiting for human approval, significantly speeding up routine tasks.

---

## AI Guidance Hierarchy

To keep the system organized, we distinguish between three types of guidance files:

| File | Audience | Purpose |
| :--- | :--- | :--- |
| **[`docs/ai/rules.md`](/docs/ai/rules.md)** | Human + AI | **Coding Standards**: Canonical rules for how code should be written (e.g., no barrel files, React Compiler rules). |
| **[`/skills/`](/skills)** | Shared AI tools, including Antigravity | **Task Guidance**: Reusable domain-specific instructions, best practices, and references for recurring work. |
| **[`.agent/workflows/`](./workflows/)** | Antigravity + workflow tooling | **Execution Playbooks**: Detailed task procedures with workflow-specific semantics such as slash-command loading and `// turbo` automation markers. |
| **`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/*.mdc`** | Tool Only | **Adapters**: Thin tool-specific entry points that should point back to the shared layers. |

---

*Part of the [AI System](/docs/ai/ai-system.md) shared guidance.*
