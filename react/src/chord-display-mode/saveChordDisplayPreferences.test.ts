import { describe, expect, it, vi } from "vitest";

import { apiUserChordDisplayModePath } from "@/shared/paths";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";

import saveChordDisplayPreferences from "./saveChordDisplayPreferences";

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;

describe("saveChordDisplayPreferences", () => {
	it("posts the preferences and returns the saved response values", async () => {
		// Arrange
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				Response.json({
					data: {
						chordDisplayCategory: ChordDisplayCategory.scaleDegree,
						chordLetterDisplay: ChordLetterDisplay.german,
						chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
					},
					success: true,
				}),
			),
		);

		try {
			// Act
			const result = await saveChordDisplayPreferences({
				chordDisplayCategory: ChordDisplayCategory.letters,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			});

			// Assert
			expect(globalThis.fetch).toHaveBeenCalledWith(apiUserChordDisplayModePath, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					chordDisplayCategory: ChordDisplayCategory.letters,
					chordLetterDisplay: ChordLetterDisplay.standard,
					chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				}),
			});
			expect(result).toStrictEqual({
				chordDisplayCategory: ChordDisplayCategory.scaleDegree,
				chordLetterDisplay: ChordLetterDisplay.german,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.sargam,
			});
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("falls back to submitted values when the payload omits fields", async () => {
		// Arrange
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("{}", { status: HTTP_OK })),
		);

		try {
			// Act
			const result = await saveChordDisplayPreferences({
				chordDisplayCategory: ChordDisplayCategory.letters,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			});

			// Assert
			expect(result).toStrictEqual({
				chordDisplayCategory: ChordDisplayCategory.letters,
				chordLetterDisplay: ChordLetterDisplay.standard,
				chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			});
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});

	it("throws when the save request fails", async () => {
		// Arrange
		const originalFetch = globalThis.fetch;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("bad", { status: HTTP_SERVER_ERROR })),
		);

		try {
			// Act & Assert
			await expect(
				saveChordDisplayPreferences({
					chordDisplayCategory: ChordDisplayCategory.letters,
					chordLetterDisplay: ChordLetterDisplay.standard,
					chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
				}),
			).rejects.toThrow("Failed to save chord display preferences (500)");
		} finally {
			vi.stubGlobal("fetch", originalFetch);
		}
	});
});
