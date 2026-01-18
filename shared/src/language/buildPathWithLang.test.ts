import { describe, expect, it } from "vitest";

import { SupportedLanguage } from "@/shared/language/supported-languages";

import buildPathWithLang from "./buildPathWithLang";

describe("buildPathWithLang", () => {
	it("builds language-prefixed paths", () => {
		expect(buildPathWithLang("/", SupportedLanguage.en)).toBe("/en");
		expect(buildPathWithLang("/foo", SupportedLanguage.es)).toBe("/es/foo");
	});

	it("replaces existing supported language prefix", () => {
		expect(buildPathWithLang("/en/foo", SupportedLanguage.es)).toBe("/es/foo");
	});

	it("preserves unknown first-segment when present", () => {
		expect(buildPathWithLang("/zz/foo", SupportedLanguage.en)).toBe("/en/zz/foo");
	});
});
