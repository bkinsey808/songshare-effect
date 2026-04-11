# `.vscode/` — VS Code Workspace Configuration

This directory holds workspace-level settings that VS Code and its extensions
recognise automatically when the project is opened.

## What VS Code Itself Recognizes

### `settings.json`

Workspace-level editor settings that override user settings for this project.
Committed settings apply to every contributor. Examples: formatter, file
association overrides, search exclusions.

`settings.json.example` is a template with opt-in local-only settings (such as
`editor.formatOnSave`). Copy it to `settings.json` and edit as needed — the
real `settings.json` is gitignored so it does not conflict across machines.

### `extensions.json`

Lists recommended VS Code extensions. When the project is opened, VS Code
prompts contributors to install any listed extension that is not already
present. Currently recommends the oxc extension (`oxc.oxc-vscode`) for
in-editor oxlint diagnostics.

To add a recommendation, append the extension ID (hover the extension in the
Extensions panel to copy it) to the `recommendations` array.

### `tasks.json`

Defines VS Code tasks runnable via the Command Palette
(`Workbench: Run Task`) or keyboard shortcuts configured in
`keybindings.json`. Current tasks:

- **Format on Save (oxfmt watcher)** — a background shell task that watches
  `**/*.{ts,tsx,js,jsx}` and runs `oxfmt --write` on each saved file.
- **Format Current File (oxfmt)** — formats the currently open file with
  `oxfmt`.

### `keybindings.json`

Workspace-scoped keyboard shortcuts. These only take effect locally and do not
override user keybindings that conflict. Current bindings:

- `Ctrl+Shift+Alt+F` — run the **Format on Save (oxfmt watcher)** task.
- `Ctrl+Alt+O` — run the **Format Current File (oxfmt)** task.

## What Is Not a Built-In VS Code File

### `agentHooks.ts`

A TypeScript type-definition file used by the Copilot agent hooks system. Not
read by VS Code itself — it provides shared types for hook scripts that are
referenced from the Copilot agent configuration.
