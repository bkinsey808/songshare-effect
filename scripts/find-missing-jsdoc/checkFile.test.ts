import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";

import { checkFile } from "./checkFile";

const TEMP_FILE = "temp-test-checkFile.ts";
const EMPTY_ISSUES = 0;

function setup(content: string): void {
	writeFileSync(TEMP_FILE, content);
}

afterAll(() => {
	if (existsSync(TEMP_FILE)) {
		unlinkSync(TEMP_FILE);
	}
});

describe("checkFile", () => {
	test("flags touching JSDoc blocks", () => {
		setup(`/**
 * Block 1
 */
/**
 * Block 2
 */
export function foo() {}
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		const hasCombinedIssue = issues.some((i) =>
			i.reason.includes("comment touches JSDoc; they should be combined"),
		);
		expect(hasCombinedIssue).toBe(true);
	});

	test("flags // comment touching JSDoc", () => {
		setup(`// some comment
/**
 * JSDoc block
 */
export function foo() {}
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		const hasCombinedIssue = issues.some((i) =>
			i.reason.includes("comment touches JSDoc; they should be combined"),
		);
		expect(hasCombinedIssue).toBe(true);
	});

	test("allows blank line before JSDoc", () => {
		setup(`// some comment

/**
 * JSDoc block
 */
export function foo() {}
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		expect(issues).toHaveLength(EMPTY_ISSUES);
	});

	test("allows JSDoc at start of block", () => {
		setup(`function bar() {
	/**
	 * JSDoc block
	 */
	const x = 1;
}
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		expect(issues).toHaveLength(EMPTY_ISSUES);
	});

	test("allows lint-disable below JSDoc", () => {
		setup(`/**
 * JSDoc block
 */
// eslint-disable-next-line
export function foo() {}
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		expect(issues).toHaveLength(EMPTY_ISSUES);
	});

	test("flags touching JSDocs even without a symbol", () => {
		setup(`/**
 * Block 1
 */
/**
 * Block 2
 */
`);
		const issues: { line: number; reason: string }[] = checkFile(TEMP_FILE);
		const hasCombinedIssue = issues.some((i) =>
			i.reason.includes("comment touches JSDoc; they should be combined"),
		);
		expect(hasCombinedIssue).toBe(true);
	});
});
