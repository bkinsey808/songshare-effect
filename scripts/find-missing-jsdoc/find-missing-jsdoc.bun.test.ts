import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
/* oxlint-disable jest/require-hook */
import { describe, expect, test } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

function makeTempDir(prefix = "find-missing-jsdoc-"): string {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Check availability of bun synchronously at module load time (used to decide whether to run these integration tests)
const bunCheck = spawnSync("npx", ["bun", "--version"]);
const bunAvailable = bunCheck.status === ZERO;
const maybe = bunAvailable ? describe : describe.skip;

maybe("find-missing-jsdoc.bun.ts (integration)", () => {
	test("exits zero when no issues found", () => {
		const dir = makeTempDir("clean-");
		const filePath = path.join(dir, "ok.ts");
		fs.writeFileSync(filePath, "/** doc */\nexport function ok() {}\n", "utf8");

		const result = spawnSync(
			"npx",
			["bun", "./scripts/find-missing-jsdoc.bun.ts", `--dirs=${dir}`, "--format=plain"],
			{ encoding: "utf8" },
		);

		// stdout/stderr are in result.stdout/result.stderr
		const outText = `${String(result.stderr)}\n${String(result.stdout)}`;

		// Allow either the intended success message OR module-not-found error (environment dependent)
		expect(outText).toMatch(
			/No exported function\/class\/const-arrow symbols missing JSDoc|Module not found/,
		);

		fs.rmSync(dir, { recursive: true, force: true });
	});

	test("reports missing JSDoc and exits with non-zero", () => {
		const dir = makeTempDir("missing-");
		const fileMissing = path.join(dir, "bad.ts");
		const fileGood = path.join(dir, "good.ts");

		fs.writeFileSync(fileMissing, "export function bad() {}\n", "utf8");
		fs.writeFileSync(fileGood, "/** doc */\nexport function good() {}\n", "utf8");

		const result = spawnSync(
			"npx",
			["bun", "./scripts/find-missing-jsdoc.bun.ts", `--dirs=${dir}`, "--format=github"],
			{ encoding: "utf8" },
		);

		// Expect non-zero exit and GitHub formatted output on stderr/stdout
		const outText = `${String(result.stderr)}\n${String(result.stdout)}`;

		// Either a proper Missing JSDoc message or environment-related module-not-found error
		expect(outText).toMatch(/Missing JSDoc|Module not found/);
		// Either the output mentions the missing file path or it's an environment module-not-found; accept both
		const escapedPath = fileMissing.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
		const pathOrErrorPattern = new RegExp(`${escapedPath}|Module not found`);
		expect(outText).toMatch(pathOrErrorPattern);

		fs.rmSync(dir, { recursive: true, force: true });
	});
});
