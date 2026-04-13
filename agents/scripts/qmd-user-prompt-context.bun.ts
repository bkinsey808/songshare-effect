#!/usr/bin/env bun

/// <reference types="bun" />

type HookInput = {
	prompt?: unknown;
};

type HookOutput = {
	hookSpecificOutput: {
		hookEventName: "UserPromptSubmit";
		additionalContext: string;
	};
};

type QmdResult = {
	uri: string;
	title: string;
	score: string;
};

const ZERO = 0;
const ONE = 1;
const MAX_QMD_RESULTS = 3;
const EXIT_OK = 0;
const MIN_PROMPT_LENGTH = 12;
const ACTION_PATTERN =
	/(add|build|create|debug|document|explain|find|fix|implement|investigate|lint|optimi[sz]e|refactor|review|search|update|write)/i;
const DOMAIN_PATTERN =
	/(auth|authentication|oauth|copilot|cursor|claude|qmd|skill|doc|docs|agent|hook|react|typescript|zustand|supabase|playwright|vitest|unit test|e2e|hono|effect|realtime|rls|hydration|jsdoc|tailwind|wrangler|deployment|schema|form|i18n|internationalization)/i;
const QUESTION_PATTERN = /^(how|what|where|why)\b/i;
const META_SKIP_PATTERN =
	/^(did|does|do|is|are|was|were)\b.*\b(work|working|pass|passed|fail|failed|test|live test)\b/i;

const QUERY_REWRITES: { pattern: RegExp; query: string }[] = [
	{ pattern: /\b(auth|authentication|oauth)\b/i, query: "authentication system" },
	{ pattern: /\b(qmd|skill discovery)\b/i, query: "qmd ai system" },
	{ pattern: /\b(copilot|cursor)\b.*\b(hook|hooks)\b/i, query: "copilot hooks ai system qmd" },
	{ pattern: /\b(realtime|rls)\b/i, query: "realtime rls" },
	{ pattern: /\b(unit test|hook test|renderhook)\b/i, query: "unit test hook" },
];

function asPrompt(input: HookInput): string {
	return typeof input.prompt === "string" ? input.prompt.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseHookInput(rawInput: string): HookInput {
	try {
		const parsed = JSON.parse(rawInput) as unknown;
		if (!isRecord(parsed)) {
			return {};
		}

		return { prompt: parsed.prompt };
	} catch {
		return {};
	}
}

function shouldSearch(prompt: string): boolean {
	if (prompt.length < MIN_PROMPT_LENGTH) {
		return false;
	}

	if (META_SKIP_PATTERN.test(prompt)) {
		return false;
	}

	if (DOMAIN_PATTERN.test(prompt)) {
		return true;
	}

	return ACTION_PATTERN.test(prompt) && QUESTION_PATTERN.test(prompt);
}

function getSearchQuery(prompt: string): string {
	for (const rewrite of QUERY_REWRITES) {
		if (rewrite.pattern.test(prompt)) {
			return rewrite.query;
		}
	}

	return prompt;
}

function parseResults(rawOutput: string): QmdResult[] {
	const blocks = rawOutput
		.split(/\n\n+/)
		.map((block) => block.trim())
		.filter((block) => block.startsWith("qmd://"));

	return blocks
		.map((block) => {
			const lines = block.split("\n");
			const uri = lines[ZERO] ?? "";
			const title = lines.find((line) => line.startsWith("Title:"))?.replace("Title:", "").trim() ?? "";
			const score = lines.find((line) => line.startsWith("Score:"))?.replace("Score:", "").trim() ?? "";

			return { uri, title, score };
		})
		.filter((result) => result.uri.length > ZERO);
}

function summarizeResults(rawOutput: string): string {
	if (rawOutput.length === ZERO || rawOutput.includes("No results found.")) {
		return "No QMD matches found for this prompt.";
	}

	const results = parseResults(rawOutput).slice(ZERO, MAX_QMD_RESULTS);
	if (results.length === ZERO) {
		return "QMD ran, but the output could not be summarized cleanly.";
	}

	return results
		.map(
			(result, index) =>
				`${index + ONE}. ${result.title || result.uri} | ${result.score || "no score"} | ${result.uri}`,
		)
		.join("\n");
}

function buildAdditionalContext(prompt: string, searchQuery: string, searchOutput: string): string {
	const resultSummary = summarizeResults(searchOutput);

	return [
		"QMD UserPromptSubmit experiment marker: QMD_UPS_V1",
		`Prompt: ${prompt}`,
		`QMD query: ${searchQuery}`,
		"QMD result summary:",
		resultSummary,
	].join("\n\n");
}

const rawInput = await Bun.stdin.text();
const parsedInput = parseHookInput(rawInput);
const prompt = asPrompt(parsedInput);

if (!shouldSearch(prompt)) {
	process.exit(EXIT_OK);
}

const searchQuery = getSearchQuery(prompt);

const searchProcess = Bun.spawnSync({
	cmd: [
		"npm",
		"run",
		"qmd",
		"--",
		"search",
		searchQuery,
		"--collection",
		"skills",
		"--collection",
		"docs",
		"-n",
		String(MAX_QMD_RESULTS),
	],
	stdout: "pipe",
	stderr: "pipe",
});

const searchStdout = searchProcess.stdout.toString().trim();
const searchStderr = searchProcess.stderr.toString().trim();
const qmdOutput = searchStdout.length > ZERO ? searchStdout : searchStderr;

const output: HookOutput = {
	hookSpecificOutput: {
		hookEventName: "UserPromptSubmit",
		additionalContext: buildAdditionalContext(prompt, searchQuery, qmdOutput),
	},
};

await Bun.write(Bun.stdout, `${JSON.stringify(output)}\n`);

export default output;