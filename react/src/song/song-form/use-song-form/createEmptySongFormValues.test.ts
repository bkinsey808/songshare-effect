import { describe, expect, it } from "vitest";

import { defaultLanguage } from "@/shared/language/supported-languages";

import type { SongFormValues } from "../song-form-types";
import createEmptySongFormValues from "./createEmptySongFormValues";

describe("createEmptySongFormValues", () => {
	it("returns an object with all required SongFormValues fields", () => {
		// Arrange
		const expectedFields: (keyof SongFormValues)[] = [
			"song_name",
			"song_slug",
			"lyrics",
			"script",
			"translations",
			"chords",
			"key",
			"short_credit",
			"long_credit",
			"public_notes",
			"private_notes",
		];

		// Act
		const result = createEmptySongFormValues();

		// Assert
		for (const field of expectedFields) {
			expect(result).toHaveProperty(field);
		}
	});

	it("initializes string fields to empty strings", () => {
		// Act
		const result = createEmptySongFormValues();

		// Assert
		expect({
			song_name: result.song_name,
			song_slug: result.song_slug,
			key: result.key,
			short_credit: result.short_credit,
			long_credit: result.long_credit,
			public_notes: result.public_notes,
			private_notes: result.private_notes,
		}).toStrictEqual({
			song_name: "",
			song_slug: "",
			key: "",
			short_credit: "",
			long_credit: "",
			public_notes: "",
			private_notes: "",
		});
	});

	it("initializes array fields with defaultLanguage in lyrics", () => {
		// Act
		const result = createEmptySongFormValues();

		// Assert
		expect({
			lyrics: result.lyrics,
			script: result.script,
			translations: result.translations,
			chords: result.chords,
		}).toStrictEqual({
			lyrics: [defaultLanguage],
			script: [],
			translations: [],
			chords: [],
		});
	});

	it("returns a fresh object on each call", () => {
		// Act
		const result1 = createEmptySongFormValues();
		const result2 = createEmptySongFormValues();

		// Assert
		expect(result1).not.toBe(result2);
		expect(result1).toStrictEqual(result2);
	});
});
