import { describe, expect, it } from "vitest";

import {
	SupportedLanguage,
	defaultLanguage,
	languageNames,
	type SupportedLanguageType,
} from "./supported-languages";

describe("supported-languages", () => {
	const langEnumCases = [
		{ name: "english enum", key: "en", actual: SupportedLanguage.en, expected: "en" },
		{ name: "spanish enum", key: "es", actual: SupportedLanguage.es, expected: "es" },
		{ name: "chinese enum", key: "zh", actual: SupportedLanguage.zh, expected: "zh" },
	];

	it.each(langEnumCases)("$name", ({ actual, expected }) => {
		// Assert
		expect(actual).toBe(expected);
	});

	const languageNameCases: { name: string; lang: SupportedLanguageType; expected: string }[] = [
		{ name: "English label", lang: "en", expected: "English" },
		{ name: "Español label", lang: "es", expected: "Español" },
		{ name: "中文 label", lang: "zh", expected: "中文" },
	];

	it.each(languageNameCases)("$name", ({ lang, expected }) => {
		// Assert
		expect(languageNames[lang]).toBe(expected);
	});

	it("defaultLanguage is en", () => {
		// Assert
		expect(defaultLanguage).toBe(SupportedLanguage.en);
	});
});
