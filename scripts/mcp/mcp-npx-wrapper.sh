#!/usr/bin/env bash
set -euo pipefail

echo_debug() {
  if [[ -n "${MCP_NPX_WRAPPER_DEBUG:-}" ]]; then
    echo "[mcp-npx-wrapper] $*" >&2
  fi
}

if [[ -n "${NPX_PATH:-}" ]]; then
  NPX_BIN="$NPX_PATH"
  echo_debug "Using NPX_PATH=$NPX_BIN"
  exec "$NPX_BIN" "$@"
fi

if command -v npx >/dev/null 2>&1; then
  NPX_BIN="$(command -v npx)"
  echo_debug "Found npx on PATH: $NPX_BIN"
  exec "$NPX_BIN" "$@"
fi

COMMON_NPX=(
  "$HOME/.nvm/versions/node/$(node -v 2>/dev/null || echo vX)/bin/npx"
  "$HOME/.nvm/versions/node/*/bin/npx"
  "/usr/local/bin/npx"
  "/usr/bin/npx"
)

for p in "${COMMON_NPX[@]}"; do
  for candidate in $p; do
    if [[ -x "$candidate" ]]; then
      echo_debug "Using candidate npx: $candidate"
      exec "$candidate" "$@"
    fi
  done
done

echo "Error: 'npx' not found. Please install Node/npm or set NPX_PATH to the full path of npx." >&2
exit 127
