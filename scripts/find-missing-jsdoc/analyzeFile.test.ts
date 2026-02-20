import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import analyzeFile from "./analyzeFile";

function writeTempFile(contents: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "analyze-file-"));
	const file = path.join(dir, "test.ts");
	fs.writeFileSync(file, contents, "utf8");
	return file;
}

describe("analyzeFile", () => {
	it("reports exported symbols without JSDoc and reports missing @returns when needed", () => {
		const contents = [
			"// helper",
			"/** This is foo */",
			"export function foo() {}",
			"",
			"export function bar() {}",
			"",
			"/** default doc */",
			"export default function baz() {}",
			"",
			"export const qux = () => {}",
			"",
			"/** Does something\n * @returns void */",
			"export function withReturns() {}",
			"",
			"export class MyClass {}",
		].join("\n");

		const file = writeTempFile(contents);
		const issues = analyzeFile(file);

		// We expect issues for: bar (no JSDoc), qux (no JSDoc), MyClass (no JSDoc)
		// and foo/baz should be reported as missing-returns (they have JSDoc but no @returns tag)
		const EXPECTED_ISSUES = 5;
		expect(issues).toHaveLength(EXPECTED_ISSUES);

		const missingReturns = issues
			.filter((i) => i.kind === "missing-returns")
			.map((i) => i.name)
			.toSorted();
		expect(missingReturns).toStrictEqual(["baz", "foo"]);

		// Debug output to inspect all reported issues
		const INDENT = 2;
		// oxlint-disable-next-line no-console
		console.warn("issues:", JSON.stringify(issues, undefined, INDENT));

		// Log issues when tests fail to help debugging (kept lightweight)
		const names = issues.map((i) => i.name);
		const duplicates = names.filter((val, idx) => names.indexOf(val) !== idx).toSorted();
		expect(duplicates).toStrictEqual([]);

		// withReturns has a @returns tag - it should NOT be reported
		expect(issues.find((i) => i.name === "withReturns")).toBeUndefined();

		// Clean up
		fs.rmSync(path.dirname(file), { recursive: true, force: true });
	});

	it("handles empty files gracefully", () => {
		const file = writeTempFile("");
		const issues = analyzeFile(file);
		expect(issues).toStrictEqual([]);
		fs.rmSync(path.dirname(file), { recursive: true, force: true });
	});
});
