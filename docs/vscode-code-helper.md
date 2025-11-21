# Fixing "Code Helper (Plugin) ENOENT" for ESLint

If you see `Error: spawn /Applications/Visual Studio Code.app/Contents/Frameworks/Code Helper (Plugin).app/Contents/MacOS/Code Helper (Plugin) ENOENT` in logs, the ESLint extension in VS Code can't spawn the plugin host binary used for extension plugin processes. This prevents the ESLint extension from loading plugins and showing diagnostics (like `eslint-comments/no-unused-disable`).

## Quick steps

1. Check the path mentioned in the error:

```bash
ls -la "/Applications/Visual Studio Code.app/Contents/Frameworks/Code Helper (Plugin).app/Contents/MacOS/"
```

2. If the path doesn't exist, run our helper script to try to detect and create a symlink, or follow the manual steps below:

```bash
# dry run — will not apply changes
bash scripts/fix-vscode-code-helper.sh --dry-run

# create symlink (requires sudo because it writes to /Applications)
sudo bash scripts/fix-vscode-code-helper.sh --apply
```

3. After the fix, restart VS Code and reload the ESLint server (Command Palette -> "ESLint: Restart ESLint Server").

4. Open `api/src/http/http-utils.ts` and check the Problems tab for the `Unused eslint-disable directive` warning on the line with `// eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types`.

If you still don't see the warning, add this to your `.vscode/settings.json` to make the extension run ESLint and report unused disable directives.

Note: ESLint v9 removed the top-level `reportUnusedDisableDirectives` option; the VS Code extension now accepts this via `overrideConfig.linterOptions.reportUnusedDisableDirectives`.

Example `.vscode/settings.json` snippet:

```jsonc
{
	"eslint.options": {
		"overrideConfig": {
			"linterOptions": {
				"reportUnusedDisableDirectives": "warn",
			},
		},
	},
}
```

### Check VS Code settings if error persists

If you're still seeing the `Invalid Options: Unknown options: reportUnusedDisableDirectives` error in the ESLint logs, the setting might be present in your **User** or another workspace setting. Search your VS Code settings (JSON mode) for `reportUnusedDisableDirectives` and remove any top-level instances.

Quick shell search across your user settings (macOS):

```bash
# Search the current user's VS Code settings directory
grep -R "reportUnusedDisableDirectives" ~/Library/Application\ Support/Code/User || true
```

If you find a match, move it under `overrideConfig.linterOptions` instead — see the example above — or remove it to let workspace settings control that option.

````

## Manual workaround

If you prefer not to use the script, rename or symlink your existing VS Code app if the extension expects `Visual Studio Code.app`:

```bash
# Example for a custom install named "Visual Studio Code - Insiders.app"
sudo ln -s "/Applications/Visual Studio Code - Insiders.app" "/Applications/Visual Studio Code.app"
````

Then restart VS Code and the ESLint server.

## Why this matters

Editors run extensions in separate plugin host processes. If the extension can't spawn that helper binary, the plugin host won't start and extension features (ESLint plugin resolution, rules like `eslint-comments`) won't load. This stops the Editor from showing warnings that the CLI shows.

By ensuring the helper binary is resolvable you restore parity between CLI and in-editor ESLint diagnostics.
