import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { checkSkillFiles } from "./checkSkillFiles";

const SMALL_LINES = 10;
const LARGE_LINES = 305;
const EXPECTED_COUNT = 1;
const MIN_ERRORS = 1;
const LINE_OFFSET = 1;
const NEWLINE = "\n";
const NO_ERRORS = 0;
const FIRST_INDEX = 0;

describe("checkSkillFiles", () => {
	it("returns no errors when SKILL.md files are under the limit", async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "check-skill-"));
		try {
			const skillDir = path.join(tmp, ".github", "skills", "s1");
			await fs.mkdir(skillDir, { recursive: true });
			const content = Array.from(
				{ length: SMALL_LINES },
				(_el, index) => `line ${index + LINE_OFFSET}`,
			).join(NEWLINE);
			await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf8");

			const res = await checkSkillFiles(tmp);
			expect(res.hasError).toBe(false);
			expect(res.checkedCount).toBe(EXPECTED_COUNT);
			expect(res.errors).toHaveLength(NO_ERRORS);
		} finally {
			await fs.rm(tmp, { recursive: true, force: true });
		}
	});

	it("returns errors when SKILL.md exceeds the limit", async () => {
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "check-skill-"));
		try {
			const skillDir = path.join(tmp, ".github", "skills", "s2");
			await fs.mkdir(skillDir, { recursive: true });
			const content = Array.from(
				{ length: LARGE_LINES },
				(_el, index) => `line ${index + LINE_OFFSET}`,
			).join(NEWLINE);
			await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf8");

			const res = await checkSkillFiles(tmp);
			expect(res.hasError).toBe(true);
			expect(res.checkedCount).toBe(EXPECTED_COUNT);
			expect(res.errors.length).toBeGreaterThanOrEqual(MIN_ERRORS);
			expect(res.errors[FIRST_INDEX]).toContain("SKILL.md");
		} finally {
			await fs.rm(tmp, { recursive: true, force: true });
		}
	});
});
