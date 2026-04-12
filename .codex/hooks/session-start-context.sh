#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' '{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "This repository keeps shared guidance canonical in /AGENTS.md, /docs/ai/rules.md, /skills, and /agents. Codex-native repo skills are exposed through /.agents/skills as a bridge to the shared /skills tree. Project-scoped Codex custom agent wrappers live under /.codex/agents and point back to the shared /agents prompts. Load the relevant shared skill or shared agent file before editing."
  }
}'
