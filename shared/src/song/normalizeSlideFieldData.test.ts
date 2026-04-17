import { describe, expect, it } from "vitest";

import normalizeSlideFieldData from "./normalizeSlideFieldData";

describe("normalizeSlideFieldData", () => {
	it("keeps current language-code keys when already present", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				sa: "Om",
				en: "Aum",
				"sa-Latn": "Om",
			},
			lyrics: "sa",
			script: "sa-Latn",
			translations: ["en"],
		});

		expect(result).toStrictEqual({
			sa: "Om",
			"sa-Latn": "Om",
			en: "Aum",
		});
	});

	it("falls back from legacy keys to language-code keys", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				lyrics: "Base lyrics",
				script: "Base script",
				enTranslation: "Base translation",
			},
			lyrics: "sa",
			script: "sa-Latn",
			translations: ["en"],
		});

		expect(result).toStrictEqual({
			sa: "Base lyrics",
			"sa-Latn": "Base script",
			en: "Base translation",
		});
	});

	it("initializes additional translations to empty strings", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				lyrics: "Base lyrics",
				enTranslation: "English translation",
			},
			lyrics: "sa",
			script: undefined,
			translations: ["en", "es"],
		});

		expect(result).toStrictEqual({
			sa: "Base lyrics",
			en: "English translation",
			es: "",
		});
	});
});
