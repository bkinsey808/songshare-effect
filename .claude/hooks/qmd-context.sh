#!/usr/bin/env bash
# Runs on every user prompt. Searches skills/ and docs/ via QMD and injects
# the top matching documents into Claude's context before it responds.
set -euo pipefail

PROMPT=$(cat | jq -r '.prompt // empty')

if [ -z "$PROMPT" ]; then
  exit 0
fi

RESULTS=$(./node_modules/.bin/qmd search "$PROMPT" --collection skills --collection docs 2>/dev/null \
  | grep -v "node-llama\|Vulkan\|SpawnError\|createError\|ChildProcess\|Warning\|falling back" \
  || true)

if [ -z "$RESULTS" ]; then
  exit 0
fi

jq -n --arg ctx "$RESULTS" '{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": ("Relevant skill/doc matches from QMD:\n\n" + $ctx)
  }
}'
