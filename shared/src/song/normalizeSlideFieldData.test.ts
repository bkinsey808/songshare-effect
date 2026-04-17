import { describe, expect, it } from "vitest";

import normalizeSlideFieldData from "./normalizeSlideFieldData";

describe("normalizeSlideFieldData", () => {
	it("keeps current static keys when already present", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				lyrics: "Om",
				script: "Om-Latn",
				en: "Aum",
			},
			lyrics: ["sa"],
			script: ["sa-Latn"],
			translations: ["en"],
		});

		expect(result).toStrictEqual({
			lyrics: "Om",
			script: "Om-Latn",
			en: "Aum",
		});
	});

	it("falls back from legacy BCP47 keys to static keys", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				sa: "Base lyrics",
				"sa-Latn": "Base script",
				enTranslation: "Base translation",
			},
			lyrics: ["sa"],
			script: ["sa-Latn"],
			translations: ["en"],
		});

		expect(result).toStrictEqual({
			lyrics: "Base lyrics",
			script: "Base script",
			en: "Base translation",
		});
	});

	it("initializes additional translations to empty strings", () => {
		const result = normalizeSlideFieldData({
			fieldData: {
				lyrics: "Base lyrics",
				enTranslation: "English translation",
			},
			lyrics: ["sa"],
			script: [],
			translations: ["en", "es"],
		});

		expect(result).toStrictEqual({
			lyrics: "Base lyrics",
			en: "English translation",
			es: "",
		});
	});
});
