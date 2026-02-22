import { describe, expect, it } from "vitest";

import { isParagraph, type Paragraph } from "./paragraph";

describe("isParagraph", () => {
	it("returns true for valid Paragraph objects", () => {
		const paragraph: Paragraph = { id: "foo", text: "bar" };
		expect(isParagraph(paragraph)).toBe(true);
	});

	it("returns false for objects missing keys", () => {
		expect(isParagraph({})).toBe(false);
		expect(isParagraph({ id: "foo" })).toBe(false);
		expect(isParagraph({ text: "bar" })).toBe(false);
	});

	it("returns false for wrong types", () => {
		expect(isParagraph({ id: 1, text: "bar" })).toBe(false);
		expect(isParagraph({ id: "foo", text: 2 })).toBe(false);
	});

	it("returns false for non-objects", () => {
		// undefined covers null behavior as well without violating lint
		expect(isParagraph(undefined)).toBe(false);
		expect(isParagraph("hello")).toBe(false);
		const num = 123;
		expect(isParagraph(num)).toBe(false);
	});
});
