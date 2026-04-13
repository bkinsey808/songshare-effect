#!/usr/bin/env bun

/// <reference types="bun" />

const output = {
	hookSpecificOutput: {
		hookEventName: "SessionStart",
		additionalContext:
			'This repository uses QMD to discover the right files under /skills and /docs before starting a task. For task-oriented work, prefer `npm run qmd -- search "<task description>"` and then load only the returned files. Use `npm run qmd -- search`, not `./node_modules/.bin/qmd`, because the wrapper suppresses node-llama-cpp noise. Prefer BM25 `search` for interactive use; `vsearch` and `query` are much slower on this machine. The committed VS Code hook only injects this stable guidance at session start. It does not run per-prompt QMD search or inject Claude-style per-prompt search results.'
	},
};

await Bun.write(Bun.stdout, `${JSON.stringify(output)}\n`);

export default output;