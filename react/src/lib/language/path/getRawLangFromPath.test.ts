import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import getRawLangFromPath from "./getRawLangFromPath";

// The helper is intentionally very small; its behaviour is driven almost
// entirely by how the incoming string is split.  The tests exercise both the
// normal "happy path" usage as well as the edge cases that trigger the
// defaultLanguage fallback.

describe("getRawLangFromPath", () => {
	it("returns the default language for an empty string", () => {
		expect(getRawLangFromPath("")).toBe(defaultLanguage);
	});

	it("returns the default language when only a leading slash is present", () => {
		expect(getRawLangFromPath("/")).toBe(defaultLanguage);
		expect(getRawLangFromPath("//")).toBe(defaultLanguage); // multiple slashes collapse
	});

	it("preserves whatever segment sits in the language position", () => {
		// supported language
		expect(getRawLangFromPath("/es/some/page")).toBe("es");
		// unsupported language should still be returned verbatim
		expect(getRawLangFromPath("/fr/hello")).toBe("fr");
		// path with no leading slash still treats the second component as the
		// language slot because the implementation blindly splits on "/".
		expect(getRawLangFromPath("en/page")).toBe("page");
	});

	it("does not coerce a missing segment to default when a non-empty segment exists", () => {
		// a single segment after slash is treated as the language value even
		// though it would ordinarily be the first path component.
		expect(getRawLangFromPath("/foo")).toBe("foo");
		expect(getRawLangFromPath("/en")).toBe("en");
	});

	it("falls back to default when the language segment is explicitly empty", () => {
		// double-slash with nothing between
		expect(getRawLangFromPath("//en")).toBe(defaultLanguage);
		expect(getRawLangFromPath("/en//foo")).toBe("en");
	});
});
