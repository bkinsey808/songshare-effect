import { describe, expect, it } from "vitest";

import { SupportedLanguage } from "@/shared/language/supported-languages";

import buildPathWithLang from "./buildPathWithLang";

describe("buildPathWithLang", () => {
	it("builds language-prefixed paths", () => {
		// Arrange
		const rootPath = "/";
		const fooPath = "/foo";
		const langEn = SupportedLanguage.en;
		const langEs = SupportedLanguage.es;

		// Act
		const rootResult = buildPathWithLang(rootPath, langEn);
		const fooResult = buildPathWithLang(fooPath, langEs);

		// Assert
		expect(rootResult).toBe("/en");
		expect(fooResult).toBe("/es/foo");
	});

	it("replaces existing supported language prefix", () => {
		// Arrange
		const input = "/en/foo";
		const targetLang = SupportedLanguage.es;

		// Act
		const result = buildPathWithLang(input, targetLang);

		// Assert
		expect(result).toBe("/es/foo");
	});

	it("preserves unknown first-segment when present", () => {
		// Arrange
		const input = "/zz/foo";
		const lang = SupportedLanguage.en;

		// Act
		const result = buildPathWithLang(input, lang);

		// Assert
		expect(result).toBe("/en/zz/foo");
	});
});
