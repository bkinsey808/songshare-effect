import { describe, expect, it } from "vitest";

import {
	SupportedLanguage,
	defaultLanguage,
	languageNames,
} from "./supported-languages";

describe("supported-languages", () => {
	it.each([
		["en", SupportedLanguage.en, "en"],
		["es", SupportedLanguage.es, "es"],
		["zh", SupportedLanguage.zh, "zh"],
	] as const)("supportedLanguage.%s is %s", (_key, actual, expected) => {
		expect(actual).toBe(expected);
	});

	it.each([
		["en", "English"],
		["es", "Español"],
		["zh", "中文"],
	] as const)("languageNames[%s] is %s", (lang, expected) => {
		expect(languageNames[lang]).toBe(expected);
	});

	it("defaultLanguage is en", () => {
		expect(defaultLanguage).toBe(SupportedLanguage.en);
	});
});
