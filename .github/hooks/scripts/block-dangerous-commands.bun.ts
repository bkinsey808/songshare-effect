#!/usr/bin/env bun
// Block dangerous terminal commands from agent PreToolUse hook calls.
//
// Receives JSON on stdin (VS Code PreToolUse format) and exits 2 with a deny
// decision if the run_in_terminal tool is about to execute a blocked command.
//
// Categories blocked: destructive git writes, sudo/system-level ops,
// recursive deletes, deployments, and database resets.

/// <reference types="bun" />

import process from "node:process";

type HookOutput = {
	hookSpecificOutput: {
		hookEventName: "PreToolUse";
		permissionDecision: "deny";
		permissionDecisionReason: string;
	};
};

const BLOCKED_PREFIXES = [
	"git commit",
	"git push",
	"git pull",
	"git fetch",
	"git merge",
	"git rebase",
	"git checkout",
	"git switch",
	"git restore",
	"git reset",
	"git clean",
	"git stash drop",
	"git stash pop",
	"git stash apply",
	"git stash clear",
	"git branch -d",
	"git branch -D",
	"git branch -m",
	"git tag",
	"git apply",
	"git am",
	"git cherry-pick",
	"git revert",
	"git worktree",
	"git submodule",
	"git config --global",
	"git config --system",
	"git remote add",
	"git remote remove",
	"git remote set-url",
	// System-level privilege escalation
	"sudo",
	"su ",
	"su -",
	"doas",
	"pkexec",
	// System package managers
	"apt install",
	"apt-get install",
	"apt remove",
	"apt-get remove",
	"apt purge",
	"apt-get purge",
	"brew install",
	"brew uninstall",
	"brew remove",
	"pip install",
	"pip uninstall",
	// Recursive / forced file deletion
	"rm -rf",
	"rm -fr",
	"rm -r",
	"rmdir",
	"shred",
	"truncate",
	// Process termination
	"kill ",
	"killall",
	"pkill",
	// Supabase destructive ops
	"supabase db reset",
	"supabase db drop",
	"supabase migration repair --status reverted",
	// Cloudflare deployments
	"wrangler deploy",
	"wrangler publish",
	"wrangler pages deploy",
	"wrangler pages publish",
	"wrangler secret",
	"wrangler kv",
	"wrangler r2",
	"wrangler d1",
	"wrangler worker delete",
	// npm/bun publish & deploy scripts
	"npm publish",
	"npm run deploy",
	"npx wrangler deploy",
	"npx wrangler publish",
	"npx wrangler pages deploy",
	"bunx wrangler deploy",
	"bunx wrangler publish",
	// Other hosting providers
	"vercel",
	"netlify deploy",
] as const;

const EXIT_OK = 0;
const EXIT_BLOCK = 2;

/** Narrows an unknown value to a plain object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** Extracts a string field from a record, returning empty string if absent. */
function str(obj: Record<string, unknown>, key: string): string {
	const val = obj[key];
	return typeof val === "string" ? val : "";
}

/** Parses raw JSON, returning undefined on failure. */
function parseJson(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

const raw = await Bun.stdin.text();
const parsed = parseJson(raw);

if (!isRecord(parsed)) {
	process.exit(EXIT_OK);
}

const toolName = str(parsed, "tool_name") || str(parsed, "toolName");

// Only inspect the terminal tool
if (toolName !== "run_in_terminal") {
	process.exit(EXIT_OK);
}

const toolInputField = parsed["tool_input"];
const inputField = parsed["input"];
let cmdSource: Record<string, unknown> | undefined = undefined;
if (isRecord(toolInputField)) {
	cmdSource = toolInputField;
} else if (isRecord(inputField)) {
	cmdSource = inputField;
}

const cmd = cmdSource === undefined ? "" : str(cmdSource, "command");
const cmdLower = cmd.trim().toLowerCase();
const blocked = BLOCKED_PREFIXES.find((prefix) => cmdLower.startsWith(prefix));

if (blocked !== undefined) {
	const reason = `Git write operations are disabled for agents. Blocked command: ${cmd}`;

	process.stderr.write(`${reason}\n`);

	const output: HookOutput = {
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason,
		},
	};

	process.stdout.write(`${JSON.stringify(output)}\n`);
	process.exit(EXIT_BLOCK);
}

process.exit(EXIT_OK);
