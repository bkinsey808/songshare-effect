#!/usr/bin/env bash
set -euo pipefail
if [ $# -lt 1 ]; then
  echo "Usage: $0 <file|dir>"
  exit 1
fi

TARGET="$1"
echo "Running ESLint to report unused disable directives for $TARGET"

# use eslint options to report unused directives as warnings
npx eslint --report-unused-disable-directives warn "$TARGET"
