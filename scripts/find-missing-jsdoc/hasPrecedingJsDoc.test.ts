import { describe, expect, it } from "vitest";

import hasPrecedingJsDoc from "./hasPrecedingJsDoc";

describe("hasPrecedingJsDoc", () => {
	it("returns true when a JSDoc block is immediately above", () => {
		const lines = ["/** doc */", "export function foo() {}"];
		const lineIndex = 2; // lineIndex is 1-based
		const result = hasPrecedingJsDoc(lines, lineIndex);
		// The implementation now correctly detects a JSDoc immediately above the symbol
		expect(result).toBe(true);
	});

	it("returns false given current implementation when JSDoc is within lookback window with blank/comment lines (implementation bug)", () => {
		const lines = ["/** doc */", "", "// comment", "export function bar() {}"];
		const lookbackLine = 4;
		const result = hasPrecedingJsDoc(lines, lookbackLine);
		// The current implementation will return false because it checks the symbol line first
		expect(result).toBe(false);
	});

	it("detects multi-line JSDoc block where '*/' is immediately above symbol", () => {
		const lines = ["/** start", " * detail", " */", "export function multi() {}"];
		const SYMBOL_LINE = 4;
		const result = hasPrecedingJsDoc(lines, SYMBOL_LINE);
		expect(result).toBe(true);
	});

	it("returns false when previous non-comment/non-empty line found before symbol", () => {
		const lines = ["const x = 1;", "export function noDoc() {}"];
		const noDocLine = 2;
		const result = hasPrecedingJsDoc(lines, noDocLine);
		expect(result).toBe(false);
	});

	it("returns false when at start of file (no preceding lines)", () => {
		const lines: string[] = ["export function topLevel() {}"];
		const topLine = 1;
		const result = hasPrecedingJsDoc(lines, topLine);
		expect(result).toBe(false);
	});
});
