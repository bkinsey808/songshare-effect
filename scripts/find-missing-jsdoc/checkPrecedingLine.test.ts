import { describe, expect, test } from "bun:test";

import { checkPrecedingLine } from "./checkPrecedingLine";

const ZERO_ISSUES = 0;
const ONE_ISSUE = 1;
const FIRST_ISSUE_INDEX = 0;

describe("checkPrecedingLine", () => {
	test("flags touching JSDoc comment", () => {
		const issues: { line: number; reason: string }[] = [];
		checkPrecedingLine({
			idx: 1,
			lines: ["// comment", "/** jsdoc */"],
			documentsSymbol: true,
			issues,
		});
		expect(issues).toHaveLength(ONE_ISSUE);
		expect(issues[FIRST_ISSUE_INDEX]?.reason).toContain(
			"comment touches JSDoc; they should be combined",
		);
	});

	test("flags missing blank line before symbol-documenting JSDoc", () => {
		const issues: { line: number; reason: string }[] = [];
		checkPrecedingLine({
			idx: 1,
			lines: ["const x = 1;", "/** jsdoc */"],
			documentsSymbol: true,
			issues,
		});
		expect(issues).toHaveLength(ONE_ISSUE);
		expect(issues[FIRST_ISSUE_INDEX]?.reason).toContain("missing blank line before JSDoc");
	});

	test("allows blank line before JSDoc", () => {
		const issues: { line: number; reason: string }[] = [];
		checkPrecedingLine({
			idx: 2,
			lines: ["const x = 1;", "", "/** jsdoc */"],
			documentsSymbol: true,
			issues,
		});
		expect(issues).toHaveLength(ZERO_ISSUES);
	});

	test("allows JSDoc after opening brace", () => {
		const issues: { line: number; reason: string }[] = [];
		checkPrecedingLine({
			idx: 1,
			lines: ["function foo() {", "/** jsdoc */"],
			documentsSymbol: true,
			issues,
		});
		expect(issues).toHaveLength(ZERO_ISSUES);
	});

	test("allows JSDoc without blank line if it does NOT document a symbol", () => {
		const issues: { line: number; reason: string }[] = [];
		checkPrecedingLine({
			idx: 1,
			lines: ["const x = 1;", "/** internal comment */"],
			documentsSymbol: false,
			issues,
		});
		expect(issues).toHaveLength(ZERO_ISSUES);
	});
});
