import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

type CheckAiSystemResult = {
	hasError: boolean;
	checkedCount: number;
	errors: string[];
};

type ForbiddenPattern = {
	pattern: RegExp;
	message: string;
};

const MARKDOWN_EXTENSIONS = [".md", ".mdc"] as const;
const ZERO = 0;

const GUIDANCE_ROOT_FILES = [
	"AGENTS.md",
	"README.md",
	"CLAUDE.md",
	"GEMINI.md",
	"api/AGENTS.md",
	"react/AGENTS.md",
	"shared/AGENTS.md",
	".github/copilot-instructions.md",
	"docs/ai/ai-system.md",
] as const;

const GUIDANCE_DIRS = [
	".cursor/rules",
	".agent/workflows",
	".codex",
	"agents",
	"docs/ai",
	"skills",
] as const;

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
	{
		pattern: /\.agent\/(rules|codebase-map|troubleshooting)\.md/,
		message:
			"legacy .agent docs should be moved to /docs/ai/ equivalents",
	},
	{
		pattern: /\.github\/skills\//,
		message: "use /skills/ instead of the removed .github/skills/ path",
	},
	{
		pattern: /\.github\/agents\//,
		message: "use /agents/ instead of the removed .github/agents/ path",
	},
	{
		pattern: /\.github\/hooks\/scripts\//,
		message: "use /agents/scripts/ instead of the removed .github/hooks/scripts/ path",
	},
	{
		pattern: /\/docs\/EFFECT_IMPLEMENTATION\.md/,
		message: "replace legacy Effect doc link with /docs/effect-ts-best-practices.md",
	},
	{
		pattern: /\/docs\/SHARED_CODE_GUIDE\.md/,
		message: "remove or replace the deleted /docs/SHARED_CODE_GUIDE.md link",
	},
	{
		pattern: /\/docs\/SUPABASE_EFFECT_SCHEMAS\.md/,
		message: "remove or replace the deleted /docs/SUPABASE_EFFECT_SCHEMAS.md link",
	},
	{
		pattern: /\/docs\/AUTHENTICATION_SYSTEM\.md/,
		message: "replace legacy auth doc link with /docs/auth/authentication-system.md",
	},
	{
		pattern: /\/docs\/effect-implementation\.md/,
		message: "replace stale /docs/effect-implementation.md link with /docs/effect-ts-best-practices.md",
	},
	{
		pattern: /\/docs\/authentication-system\.md/,
		message: "replace stale /docs/authentication-system.md link with /docs/auth/authentication-system.md",
	},
] as const;

function isMarkdownFile(filePath: string): boolean {
	return MARKDOWN_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
	const results: string[] = [];
	let names: string[] = [];

	try {
		names = await readdir(dir);
	} catch {
		return results;
	}

	for (const name of names) {
		const fullPath = path.join(dir, name);
		// oxlint-disable-next-line no-await-in-loop
		const info = await stat(fullPath);
		if (info.isDirectory()) {
			// oxlint-disable-next-line no-await-in-loop
			results.push(...(await collectMarkdownFiles(fullPath)));
		} else if (info.isFile() && isMarkdownFile(fullPath)) {
			results.push(fullPath);
		}
	}

	return results;
}

function validateAgentFrontmatter(relPath: string, content: string): string[] {
	if (!relPath.startsWith("agents/") || !relPath.endsWith(".agent.md")) {
		return [];
	}

	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (frontmatterMatch === null) {
		return [`error: ${relPath} is missing frontmatter.`];
	}

	const [, frontmatter] = frontmatterMatch;
	if (frontmatter === undefined) {
		return [`error: ${relPath} has unreadable frontmatter.`];
	}

	const errors: string[] = [];

	if (!/^name:/m.test(frontmatter)) {
		errors.push(`error: ${relPath} is missing a name field in frontmatter.`);
	}

	if (!/^description:/m.test(frontmatter)) {
		errors.push(
			`error: ${relPath} is missing a description field in frontmatter.`,
		);
	}

	return errors;
}

function validateForbiddenPatterns(relPath: string, content: string): string[] {
	return FORBIDDEN_PATTERNS.flatMap(({ pattern, message }) =>
		pattern.test(content) ? [`error: ${relPath} ${message}.`] : [],
	);
}

async function checkAiSystem(repoRoot: string): Promise<CheckAiSystemResult> {
	const files = new Set<string>();

	for (const relPath of GUIDANCE_ROOT_FILES) {
		const fullPath = path.join(repoRoot, relPath);
		try {
			// oxlint-disable-next-line no-await-in-loop
			const info = await stat(fullPath);
			if (info.isFile()) {
				files.add(fullPath);
			}
		} catch {
			// Some files may be intentionally absent in some environments.
		}
	}

	for (const relDir of GUIDANCE_DIRS) {
		const fullDir = path.join(repoRoot, relDir);
		// oxlint-disable-next-line no-await-in-loop
		const nestedFiles = await collectMarkdownFiles(fullDir);
		for (const filePath of nestedFiles) {
			files.add(filePath);
		}
	}

	const errors: string[] = [];
	for (const filePath of files) {
		// oxlint-disable-next-line no-await-in-loop
		const content = await readFile(filePath, "utf8");
		const relPath = path.relative(repoRoot, filePath);
		errors.push(...validateForbiddenPatterns(relPath, content));
		errors.push(...validateAgentFrontmatter(relPath, content));
	}

	return {
		hasError: errors.length !== ZERO,
		checkedCount: files.size,
		errors,
	};
}

export { checkAiSystem };
export type { CheckAiSystemResult };
export default checkAiSystem;
