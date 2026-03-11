import { describe, expect, it } from "vitest";

import toTitleCase from "./toTitleCase";

describe("toTitleCase", () => {
	it("capitalizes each word", () => {
		expect(toTitleCase("hello world")).toBe("Hello World");
	});

	it("handles single word", () => {
		expect(toTitleCase("hello")).toBe("Hello");
	});

	it("converts mid-word uppercase to lowercase", () => {
		expect(toTitleCase("hELLO wORLD")).toBe("Hello World");
	});

	it("handles empty string", () => {
		expect(toTitleCase("")).toBe("");
	});

	it("handles multiple spaces between words", () => {
		expect(toTitleCase("hello   world")).toBe("Hello   World");
	});

	it("preserves first character and lowercases rest per word", () => {
		expect(toTitleCase("HELLO")).toBe("Hello");
	});
});
