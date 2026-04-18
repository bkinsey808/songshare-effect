import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import analyzeFile from "./analyzeFile";

/**
 * Write a temporary TypeScript file and return its path.
 * @param contents - File contents to write.
 * @returns Path to the temporary file.
 */
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

		// Sanity check: no duplicate issue names
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

	it("requires object parameter docs to match exact property names", () => {
		const contents = [
			"type DemoProps = Readonly<{ title: string; colSpan: number }>; ",
			"",
			"/**",
			" * Render a demo component.",
			" *",
			" * @param props - Component props",
			" * @param props.title - Title to display",
			" * @param title - Title to display",
			" * @returns void",
			" */",
			"export function renderDemo(props: DemoProps): void {",
			"\tvoid props;",
			"}",
		].join("\n");

		const file = writeTempFile(contents);
		const issues = analyzeFile(file);

		expect(issues).toStrictEqual([
			expect.objectContaining({
				detail: "Missing @param for 'colSpan'",
				kind: "missing-param",
				name: "renderDemo",
			}),
			expect.objectContaining({
				detail: "Unexpected @param for 'props'",
				kind: "unexpected-param",
				name: "renderDemo",
			}),
			expect.objectContaining({
				detail: "Unexpected @param for 'props.title'",
				kind: "unexpected-param",
				name: "renderDemo",
			}),
		]);

		fs.rmSync(path.dirname(file), { recursive: true, force: true });
	});

	it("accepts destructured object params documented by direct field names only", () => {
		const contents = [
			"/**",
			" * Render a demo component.",
			" *",
			" * @param title - Title to display",
			" * @param colSpan - Number of columns to span",
			" * @returns void",
			" */",
			"export function renderDemo({ title, colSpan }: { title: string; colSpan: number }): void {",
			"\tvoid title;",
			"\tvoid colSpan;",
			"}",
		].join("\n");

		const file = writeTempFile(contents);
		const issues = analyzeFile(file);
		expect(issues).toStrictEqual([]);

		fs.rmSync(path.dirname(file), { recursive: true, force: true });
	});
});
