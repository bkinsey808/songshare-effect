import { describe, expect, it } from "vitest";

import { ANSI_REGEX, stripAnsi } from "./stripAnsi";

describe("stripAnsi", () => {
	it("removes ANSI escape sequences from string", () => {
		const input = "\u001B[31mred\u001B[0m text";
		expect(stripAnsi(input)).toBe("red text");
	});

	it("returns empty string when input is only ANSI codes", () => {
		expect(stripAnsi("\u001B[0m")).toBe("");
	});

	it("returns input unchanged when no ANSI codes present", () => {
		const input = "plain text";
		expect(stripAnsi(input)).toBe(input);
	});

	it("removes multiple ANSI sequences", () => {
		const input = "\u001B[1mbold\u001B[0m \u001B[32mgreen\u001B[0m";
		expect(stripAnsi(input)).toBe("bold green");
	});

	it("handles complex ANSI sequences with semicolons", () => {
		const input = "\u001B[1;33myellow bold\u001B[0m";
		expect(stripAnsi(input)).toBe("yellow bold");
	});
});

describe("ansi regex", () => {
	const EXPECTED_MATCH_COUNT = 2;

	it("matches ANSI escape sequences", () => {
		const str = "a\u001B[31mb\u001B[0mc";
		const matches = str.match(ANSI_REGEX);
		expect(matches).not.toBeNull();
		expect(matches).toHaveLength(EXPECTED_MATCH_COUNT);
	});
});
