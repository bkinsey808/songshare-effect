# `.github/` — GitHub-Native Files And Tool Adapters

This directory mixes two kinds of files:

- paths that GitHub itself recognizes automatically
- paths that are only meaningful to a GitHub-adjacent tool such as Copilot

That distinction matters, because not everything under `.github/` is a GitHub
platform feature.

## What GitHub Itself Recognizes

### `.github/workflows/`

This is the main GitHub-native directory in this repo. Any `.yml` file here is
treated as a GitHub Actions workflow.

Current workflows:

- `pr-checks.yml` runs the main pull request checks: lint, unit tests,
  `dist/functions` validation, and a Playwright smoke run.
- `e2e.yml` runs Playwright end-to-end tests on pushes to `main`, on a schedule,
  and via manual dispatch.
- `coverage.yml` runs unit tests with coverage and uploads the coverage
  artifacts.
- `commitlint.yml` validates commit messages on pull requests.

If you add another file under `.github/workflows/`, GitHub will try to load it
as an Actions workflow.

### Other GitHub-recognized names

These are not currently present here, but GitHub also gives special meaning to
names such as:

- `.github/ISSUE_TEMPLATE/`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/CODEOWNERS`
- `.github/dependabot.yml`
- `.github/FUNDING.yml`
- `.github/SECURITY.md`

If one of those appears later, GitHub will treat it specially.

## What GitHub Tools Recognize

### `.github/copilot-instructions.md`

This file is not for GitHub Actions. It is a GitHub Copilot-specific adapter
that points back to the repo's shared AI system:

- [`AGENTS.md`](../AGENTS.md)
- [`docs/ai/rules.md`](../docs/ai/rules.md)
- [`docs/ai/ai-system.md`](../docs/ai/ai-system.md)

In this repo, it should stay thin. Reusable guidance belongs in shared docs,
skills, or agent files rather than being duplicated here.

## What Is Repo-Specific, Not GitHub-Native

### `.github/hooks/`

This directory is not a GitHub platform convention. GitHub.com does not do
anything with it by default.

**Repository standard:** Workspace hooks for **GitHub Copilot and Cursor** (VS Code
`chat.useCustomAgentHooks`) are defined **here** — not duplicated under
`.cursor/hooks.json` for shared behavior.

In this repo it is used by local agent tooling:

- `hooks/block-dangerous-commands.json` defines a `PreToolUse` hook
- that hook runs `agents/scripts/block-dangerous-commands.bun.ts`
- the goal is to stop obviously dangerous shell commands before execution
- `hooks/qmd-session-context.json` defines a `SessionStart` hook
- that hook runs `agents/scripts/qmd-session-start-context.bun.ts`
- the goal is to inject stable QMD usage guidance into VS Code agent sessions
- `hooks/qmd-user-prompt-context.json` defines a `UserPromptSubmit` hook
- that hook runs `agents/scripts/qmd-user-prompt-context.bun.ts`
- the goal is to run a filtered prompt-time QMD search and inject a compact
  result summary for Copilot/Cursor

So this path has special meaning here, but only because repo tooling is wired
to it.

## What Is Human-Only

### `.github/README.md`

This file is just documentation for contributors. GitHub does not treat it as a
special configuration file.

## Rule Of Thumb

- If GitHub should execute it automatically, it probably belongs in
  `.github/workflows/` or another GitHub-reserved filename.
- If it is guidance for Copilot, keep it in `.github/copilot-instructions.md`
  and keep it thin.
- If it is repo-specific tooling that merely happens to live under `.github/`,
  document who reads it and do not assume GitHub itself cares about it.

## See Also

- [`AGENTS.md`](../AGENTS.md)
- [`docs/ai/ai-system.md`](../docs/ai/ai-system.md)
- [`docs/ai/rules.md`](../docs/ai/rules.md)
- [`copilot-instructions.md`](./copilot-instructions.md)
