import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkAiSystem } from "./checkAiSystem";

const NO_ERRORS = 0;
const MIN_ERRORS = 2;

async function writeFile(repoRoot: string, relPath: string, content: string): Promise<void> {
	const fullPath = path.join(repoRoot, relPath);
	await fs.mkdir(path.dirname(fullPath), { recursive: true });
	await fs.writeFile(fullPath, content, "utf8");
}

describe("checkAiSystem", () => {
	it("passes when shared AI files use current paths and agent frontmatter", async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "check-ai-system-"));
		try {
			await writeFile(tmp, "README.md", "# Readme\n");
			await writeFile(
				tmp,
				"agents/Playwright Agent.agent.md",
				`---
name: "Playwright Agent"
description: "Writes Playwright tests."
---
`,
			);

			const result = await checkAiSystem(tmp);
			expect(result.hasError).toBe(false);
			expect(result.errors).toHaveLength(NO_ERRORS);
		} finally {
			await fs.rm(tmp, { recursive: true, force: true });
		}
	});

	it("reports stale migration paths and missing agent name fields", async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "check-ai-system-"));
		try {
			await writeFile(
				tmp,
				"README.md",
				"See /docs/EFFECT_IMPLEMENTATION.md and .github/skills/foo/SKILL.md.\n",
			);
			await writeFile(
				tmp,
				"agents/Playwright Agent.agent.md",
				`---
description: "Writes Playwright tests."
---
`,
			);

			const result = await checkAiSystem(tmp);
			expect(result.hasError).toBe(true);
			expect(result.errors.length).toBeGreaterThanOrEqual(MIN_ERRORS);
			expect(
				result.errors.some((error) => error.includes("missing a name field")),
			).toBe(true);
			expect(
				result.errors.some((error) => error.includes("legacy Effect doc link")),
			).toBe(true);
		} finally {
			await fs.rm(tmp, { recursive: true, force: true });
		}
	});
});
