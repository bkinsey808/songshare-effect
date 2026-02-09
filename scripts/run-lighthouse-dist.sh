#!/usr/bin/env bash
set -euo pipefail

# Build, preview dist, run Lighthouse spec against preview, save report, and clean up
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building client..."
npm run build:client

# Start preview in background
echo "Starting preview server..."
npm run preview > /tmp/lh-preview.log 2>&1 &
PREVIEW_PID=$!
trap 'echo "Stopping preview..."; kill "$PREVIEW_PID" >/dev/null 2>&1 || true' EXIT

# Wait for preview to be reachable
echo "Waiting for preview at https://localhost:4173/"
# Use wait-on (devDependency)
npx wait-on --timeout 20000 https://localhost:4173

export LH_OUTPUT_DIR="./tmp/lh-report"
mkdir -p "$LH_OUTPUT_DIR"
export CHROME_PATH=$(node -e "console.log(require('playwright').chromium.executablePath())")
export CHROME_BIN=$CHROME_PATH
export LIGHTHOUSE_MODE=dist
export LIGHTHOUSE_URL=https://localhost:4173

echo "Running Lighthouse spec against preview..."
# Force single-worker and single spec run
npx playwright test e2e/specs/lighthouse.spec.ts --project=chromium --reporter=list -j 1 || EXIT_CODE=$?;

# Allow trap to run and then exit with the test exit code if present
sleep 1
if [ -n "${EXIT_CODE-}" ]; then
  echo "Playwright returned exit code $EXIT_CODE"
  exit $EXIT_CODE
fi

echo "Lighthouse run complete. Report(s) saved to $LH_OUTPUT_DIR"