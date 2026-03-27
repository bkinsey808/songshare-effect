import { describe, expect, it } from "vitest";

import getPathWithoutLang from "./getPathWithoutLang";

describe("getPathWithoutLang", () => {
	const rootCases = [
		{ name: "root pathname", input: "/", expected: "/" },
		{ name: "empty pathname", input: "", expected: "/" },
	];

	it.each(rootCases)("$name", ({ input, expected }) => {
		// Assert
		expect(getPathWithoutLang(input)).toBe(expected);
	});

	const removeLangCases = [
		{ name: "top-level lang segment", input: "/en", expected: "/" },
		{ name: "lang segment with trailing slash", input: "/en/", expected: "/" },
		{ name: "lang segment with path", input: "/en/foo", expected: "/foo" },
		{ name: "spanish dashboard", input: "/es/dashboard", expected: "/dashboard" },
		{ name: "chinese settings", input: "/zh/settings", expected: "/settings" },
	];

	it.each(removeLangCases)("$name", ({ input, expected }) => {
		// Assert
		expect(getPathWithoutLang(input)).toBe(expected);
	});

	const preserveCases = [
		{ name: "normal path", input: "/foo", expected: "/foo" },
		{ name: "unknown two-letter prefix", input: "/zz/foo", expected: "/zz/foo" },
		{ name: "unknown path", input: "/unknown/path", expected: "/unknown/path" },
	];

	it.each(preserveCases)("$name", ({ input, expected }) => {
		// Assert
		expect(getPathWithoutLang(input)).toBe(expected);
	});

	const leadingSlashCases = [{ name: "missing leading slash", input: "foo", expected: "/foo" }];

	it.each(leadingSlashCases)("$name", ({ input, expected }) => {
		// Assert
		expect(getPathWithoutLang(input)).toBe(expected);
	});
});
