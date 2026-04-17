# Antigravity Rules — songshare-effect

This file defines behavioral guardrails strictly for Antigravity's multi-turn mission execution.
For the official schema and capabilities of this file, see the [Antigravity Documentation](https://antigravity.google.com/docs/rules).

> [!IMPORTANT]
> For all codebase formatting, structural conventions, and language best practices, you MUST defer to the shared [docs/ai/rules.md](/docs/ai/rules.md). Do not duplicate coding rules here.

## 1. Mission Checklists
Antigravity operates differently than transactional chatbots by executing multi-step missions. You must always maintain an ongoing task list (typically in the `task.md` artifact) when executing a workflow playbook.
- Treat the steps defined in `.agent/workflows/*.md` files as a strict, non-negotiable checklist.
- Check off items systematically across conversation turns to prevent context loss or hallucinated steps.

## 2. Discovery First
Before beginning a new task that involves code modification, you must always run the QMD search workflow to retrieve relevant project context.
- Use the [`/qmd` workflow](/.agent/workflows/qmd.md) or manually run `npm run qmd -- search "<task description>"` if you are not already running a playbook that does this. See [docs/ai/qmd.md](/docs/ai/qmd.md) for more details.
- Only load the files returned by the search that are explicitly relevant.

## 3. Playbook Discipline
When executing playbooks (like `/deploy` or `/update-schema`), you must follow the steps linearly.
- **Never** skip intermediate verification steps (e.g., do not deploy directly to production without testing in staging first).
- If a step marked with `// turbo` fails, you must stop the autonomous execution, evaluate the logs, and report the failure to the user for guidance before proceeding.

## 4. Documentation Upkeep
If you discover a repetitive pattern, a missing piece of architecture, or a common pitfall during a mission, do not hide it inside a conversation turn. Extract that knowledge and propose creating or updating a `skills/*/SKILL.md` file so the entire AI system benefits.
