#!/usr/bin/env bash
set -euo pipefail

# Run lint, typecheck, and vitest for a given file or the whole repo.
# Usage: ./run-unit-tests.sh [path/to/test.file.ts]

echo "Unit test helper starting..."
if ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: npx is required but was not found in PATH"
  exit 1
fi

FILE=${1:-}
if [ -n "$FILE" ]; then
  echo "Running lint, typecheck, and vitest for file: $FILE"
  npm run lint
  npx tsc -b .
  npx vitest run "$FILE"
else
  echo "Running lint, typecheck, and all vitest tests"
  npm run lint
  npx tsc -b .
  npm run test:unit --silent
fi
