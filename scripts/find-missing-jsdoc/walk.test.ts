import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import walk from "./walk";

function mkTmpDir(): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "walk-test-"));
	return dir;
}

describe("walk", () => {
	it("finds .ts and .tsx files and skips ignored directories", () => {
		const root = mkTmpDir();

		// create files and dirs
		const fileA = path.join(root, "a.ts");
		fs.writeFileSync(fileA, "export const a = 1;", "utf8");

		const fileB = path.join(root, "b.js");
		fs.writeFileSync(fileB, "console.log('nope');", "utf8");

		const sub = path.join(root, "sub");
		fs.mkdirSync(sub);
		const fileC = path.join(sub, "c.tsx");
		fs.writeFileSync(fileC, "export const c = 2;", "utf8");

		const ignoredDir = path.join(root, "node_modules");
		fs.mkdirSync(ignoredDir);
		const fileD = path.join(ignoredDir, "d.ts");
		fs.writeFileSync(fileD, "export const d = 3;", "utf8");

		// collect
		const found: string[] = [];
		walk(root, (filePath) => found.push(filePath));

		// normalize for comparison
		const relativeSorted = found.map((filePath) => path.relative(root, filePath)).toSorted();
		expect(relativeSorted).toStrictEqual(["a.ts", path.join("sub", "c.tsx")]);

		// cleanup
		fs.rmSync(root, { recursive: true, force: true });
	});

	it("no files found when only ignored directories exist", () => {
		const root = mkTmpDir();
		const ignored = path.join(root, "tmp");
		fs.mkdirSync(ignored);
		const file = path.join(ignored, "ignored.ts");
		fs.writeFileSync(file, "export const i = 1;", "utf8");

		const found: string[] = [];
		walk(root, (filePath) => found.push(filePath));

		expect(found).toStrictEqual([]);

		fs.rmSync(root, { recursive: true, force: true });
	});
});
