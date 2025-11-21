#!/usr/bin/env bash
# Detect and optionally create a symlink so the plugin host binary matches the path
# expected by some extensions (e.g., Code Helper (Plugin) in Visual Studio Code).
# Use only if you understand risk of symlinks and have permission.
#
# USAGE: sudo bash scripts/fix-vscode-code-helper.sh --dry-run
#        sudo bash scripts/fix-vscode-code-helper.sh --apply
set -euo pipefail

DRY_RUN=false
APPLY=false
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown flag: $arg"; exit 1 ;;
  esac
done

EXPECTED_PATH="/Applications/Visual Studio Code.app/Contents/Frameworks/Code Helper (Plugin).app/Contents/MacOS/Code Helper (Plugin)"

if [ -e "$EXPECTED_PATH" ]; then
  echo "Expected Code Helper path exists: $EXPECTED_PATH"
  exit 0
fi

# Search for Code Helper in all VS Code variants
FOUND_APPS=($(mdfind -name "Visual Studio Code*.app" | tr '\n' ' '))
if [ ${#FOUND_APPS[@]} -eq 0 ]; then
  echo "No Visual Studio Code app found with mdfind. Try searching manually in /Applications or /opt" >&2
  exit 1
fi

echo "Found Visual Studio Code apps:"
for app in "${FOUND_APPS[@]}"; do
  echo "  - $app"
done

# Choose one candidate which is not already the expected path
SELECTED=""
for app in "${FOUND_APPS[@]}"; do
  if [ "$app" != "/Applications/Visual Studio Code.app" ]; then
    SELECTED="$app"
    break
  fi
done

if [ -z "$SELECTED" ]; then
  SELECTED="${FOUND_APPS[0]}"
fi

echo "Using candidate app: $SELECTED"
CODE_HELPER_PATH="$SELECTED/Contents/Frameworks/Code Helper (Plugin).app/Contents/MacOS/Code Helper (Plugin)"

if [ -e "$CODE_HELPER_PATH" ]; then
  echo "Found matching helper binary at $CODE_HELPER_PATH"
  echo "If you still see ENOENT in ESLint logs, create a symlink pointing the canonical name to the app used by the extension."
  echo "Canonical expected path: $EXPECTED_PATH"
  echo "Symlink target: $SELECTED"
  if [ "$DRY_RUN" = true ]; then
    echo "Dry run: not creating symlink. Run with --apply to create symlink (requires sudo)."
    exit 0
  fi
  if [ "$APPLY" = true ]; then
    echo "Creating symlink from $SELECTED to /Applications/Visual Studio Code.app"
    sudo ln -s "$SELECTED" "/Applications/Visual Studio Code.app" || true
    echo "Symlink created. You may need to restart VS Code and then the ESLint server." 
  else
    echo "Ship: use --apply to write changes." 
  fi
  exit 0
fi

# Try the Insiders path if nothing else
if [ -e "/Applications/Visual Studio Code - Insiders.app/Contents/Frameworks/Code Helper (Plugin).app/Contents/MacOS/Code Helper (Plugin)" ]; then
  echo "VS Code Insiders Code Helper exists at the canonical path. If you use Insiders, create a symlink from the Insiders app to Visual Studio Code.app if needed."
  exit 0
fi

# If nothing found
echo "Couldn't resolve Code Helper (Plugin) binary automatically. If you use a custom install, rename or create a symlink to "/Applications/Visual Studio Code.app" to match the path expected by the plugin host."
exit 1
