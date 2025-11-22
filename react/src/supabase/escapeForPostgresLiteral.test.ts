import { describe, expect, it } from "vitest";

import escapeForPostgresLiteral from "./escapeForPostgresLiteral";

describe("escapeForPostgresLiteral", () => {
	it("returns simple strings unchanged", () => {
		expect(escapeForPostgresLiteral("abc")).toBe("abc");
	});

	it("doubles single quotes", () => {
		expect(escapeForPostgresLiteral("O'Reilly")).toBe("O''Reilly");
	});

	it("escapes backslashes before quotes so combos like '\\'' are safe", () => {
		// input: backslash + single-quote
		// JS string containing backslash then single quote
		const input = "\\'";
		// expected:
		// - backslash -> \\\\ (escaped to two backslashes)
		// - single quote -> '' (doubled)
		expect(escapeForPostgresLiteral(input)).toBe("\\\\''");
	});

	it("handles multiple backslashes and quotes", () => {
		// mixed quotes/backslashes
		const input = "a'b\\c\\\\'d";
		const out = escapeForPostgresLiteral(input);
		// assert that single quotes are doubled and backslashes are doubled
		const origSingleQuotes = (input.match(/'/g) || []).length;
		const outSingleQuotes = (out.match(/'/g) || []).length;
		expect(outSingleQuotes).toBe(origSingleQuotes * 2);

		const origBackslashes = (input.match(/\\/g) || []).length;
		const outBackslashes = (out.match(/\\/g) || []).length;
		expect(outBackslashes).toBe(origBackslashes * 2);
	});
});
