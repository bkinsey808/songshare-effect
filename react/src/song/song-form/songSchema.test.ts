import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import { slideSchema, slidesSchema, songFormFields, songFormSchema } from "./songSchema";

describe("songSchema", () => {
	describe("songFormFields", () => {
		it("has expected field names", () => {
			expect(songFormFields).toContain("song_id");
			expect(songFormFields).toContain("song_name");
			expect(songFormFields).toContain("translations");
			expect(songFormFields).toContain("key");
			expect(songFormFields).toContain("tags");
			expect(songFormFields).toContain("slides");
		});
	});

	describe("slideSchema", () => {
		it("decodes valid slide", () => {
			const input = {
				slide_name: "Verse 1",
				field_data: { line1: "Hello", line2: "World" },
			} as unknown;

			const result = decodeUnknownSyncOrThrow(slideSchema, input);

			expect(result).toBeDefined();
			expect(result.slide_name).toBe("Verse 1");
			expect(result.field_data).toStrictEqual({ line1: "Hello", line2: "World" });
		});
	});

	describe("slidesSchema", () => {
		it("decodes record of slides", () => {
			const input = {
				"slide-1": { slide_name: "A", field_data: {} },
				"slide-2": { slide_name: "B", field_data: { line: "value" } },
			} as unknown;

			const result = decodeUnknownSyncOrThrow(slidesSchema, input);

			expect(result["slide-1"]?.slide_name).toBe("A");
			expect(result["slide-2"]?.slide_name).toBe("B");
		});
	});

	describe("songFormSchema", () => {
		it("decodes valid form data", () => {
			const input = {
				song_name: "My Song",
				song_slug: "my-song",
				lyrics: "en",
				translations: ["es"],
				key: "Bb",
				slide_order: ["s1", "s2"],
				tags: ["worship", "fast"],
				slides: { s1: { slide_name: "Verse", field_data: {} } },
			} as unknown;

			const result = decodeUnknownSyncOrThrow(songFormSchema, input);

			expect(result).toMatchObject({
				song_name: "My Song",
				song_slug: "my-song",
				translations: ["es"],
				key: "Bb",
				slide_order: ["s1", "s2"],
				tags: ["worship", "fast"],
				slides: {
					s1: {
						slide_name: "Verse",
					},
				},
			});
		});

		it("throws when lyrics is not a valid language code", () => {
			const input = {
				song_name: "My Song",
				song_slug: "my-song",
				lyrics: "",
				translations: [],
				slide_order: [],
				slides: {},
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(songFormSchema, input)).toThrow(/lyrics|language|decode/i);
		});

		it("throws when key is not in the allowed list", () => {
			const input = {
				song_name: "My Song",
				song_slug: "my-song",
				lyrics: "en",
				translations: [],
				key: "H",
				slide_order: [],
				slides: {},
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(songFormSchema, input)).toThrow(/key|literal|decode/i);
		});

		it("throws when song_name is missing", () => {
			const input = {
				song_slug: "slug",
				lyrics: "en",
				translations: [],
				slide_order: [],
				slides: {},
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(songFormSchema, input)).toThrow(
				/song_name|required|decode/i,
			);
		});
	});
});
