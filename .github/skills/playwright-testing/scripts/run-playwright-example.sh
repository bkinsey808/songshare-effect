#!/usr/bin/env bash
set -euo pipefail

# Simple helper to run or dry-run the Playwright example spec bundled with this skill.
# Usage:
#   ./run-playwright-example.sh         -> runs the example spec (headless)
#   ./run-playwright-example.sh --dry-run -> validate config + example existence

echo "Playwright example runner"
if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is required but was not found in PATH"
  exit 1
fi

DRY=${1:-}
SPEC_PATH=".github/skills/playwright-testing/example.spec.ts"

if [ "$DRY" = "--dry-run" ]; then
  echo "Dry run: checking Playwright configuration and example spec exists"
  if [ ! -f "$SPEC_PATH" ]; then
    echo "ERROR: $SPEC_PATH not found"
    exit 1
  fi
  npx playwright test --list --project=chromium || true
  echo "Dry run complete."
  exit 0
fi

if [ ! -f "$SPEC_PATH" ]; then
  echo "ERROR: example spec not found at $SPEC_PATH"
  exit 1
fi

echo "Running Playwright example spec: $SPEC_PATH (headless)"
npx playwright test "$SPEC_PATH" --project=chromium
