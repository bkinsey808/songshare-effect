import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import getCurrentLangFromPath from "./getCurrentLangFromPath";

// The existing `useCurrentLang.test.tsx` exercises this function already, but
// the unit-testing agent works one source file at a time.  Having a dedicated
// test makes it easier to track coverage and prevents accidental coupling with
// the routing-related `useCurrentLang` tests.

describe("getCurrentLangFromPath", () => {
	it("returns a supported language when the first segment is valid", () => {
		expect(getCurrentLangFromPath("/es/songs")).toBe("es");
		// supported but not part of our list should fall back
		expect(getCurrentLangFromPath("/fr/dashboard")).toBe(defaultLanguage);
	});

	it("falls back to defaultLanguage when the segment is missing or unsupported", () => {
		expect(getCurrentLangFromPath("/")).toBe(defaultLanguage);
		expect(getCurrentLangFromPath("/zz/foo")).toBe(defaultLanguage);
		expect(getCurrentLangFromPath("/foo/bar")).toBe(defaultLanguage);
	});

	it("falls back when the segment is empty or malformed", () => {
		// consecutive slashes produce an empty segment at the index, which
		// should trigger the defaultLanguage fallback rather than claiming a
		// valid language.
		expect(getCurrentLangFromPath("//es//nested")).toBe(defaultLanguage);
		expect(getCurrentLangFromPath("/en")).toBe("en");
	});
});
