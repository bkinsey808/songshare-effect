import { describe, expect, it } from "vitest";

import decodeUnknownSyncOrThrow from "@/shared/validation/decodeUnknownSyncOrThrow";

import {
	slideSchema,
	slidesSchema,
	songFormFields,
	songFormSchema,
} from "./songSchema";

describe("songSchema", () => {
	describe("songFormFields", () => {
		it("has expected field names", () => {
			expect(songFormFields).toContain("song_id");
			expect(songFormFields).toContain("song_name");
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
				fields: ["verse", "chorus"],
				slide_order: ["s1", "s2"],
				slides: { s1: { slide_name: "Verse", field_data: {} } },
			} as unknown;

			const result = decodeUnknownSyncOrThrow(songFormSchema, input);

			expect(result.song_name).toBe("My Song");
			expect(result.song_slug).toBe("my-song");
			expect(result.fields).toStrictEqual(["verse", "chorus"]);
			expect(result.slide_order).toStrictEqual(["s1", "s2"]);
			expect(result.slides["s1"]?.slide_name).toBe("Verse");
		});

		it("throws when song_name is missing", () => {
			const input = {
				song_slug: "slug",
				fields: [],
				slide_order: [],
				slides: {},
			} as unknown;

			expect(() => decodeUnknownSyncOrThrow(songFormSchema, input)).toThrow(
				/song_name|required|decode/i,
			);
		});
	});
});
