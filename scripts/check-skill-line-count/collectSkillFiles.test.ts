import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("collectSkillFiles", () => {
	it("returns an empty array when directory cannot be read", async () => {
		const { default: collectSkillFiles } = await import("./collectSkillFiles");
		const result = await collectSkillFiles("/path/does/not/exist-hopefully");
		expect(result).toStrictEqual([]);
	});

	it("recursively collects only SKILL.md files using real filesystem", async () => {
		const tmp = await mkdtemp(path.join(os.tmpdir(), "collect-skill-test-"));
		const sub = path.join(tmp, "subdir");
		const deep = path.join(sub, "deep");
		await mkdir(sub, { recursive: true });
		await mkdir(deep, { recursive: true });

		const rootSkill = path.join(tmp, "SKILL.md");
		const subSkill = path.join(sub, "SKILL.md");
		const other = path.join(deep, "not-a-skill.md");

		await writeFile(rootSkill, "root");
		await writeFile(subSkill, "sub");
		await writeFile(other, "deep");

		const { default: collectSkillFiles } = await import("./collectSkillFiles");
		const result = await collectSkillFiles(tmp);

		expect(result.toSorted()).toStrictEqual([rootSkill, subSkill].toSorted());

		await rm(tmp, { recursive: true, force: true });
	});
});
