import { Schema } from "effect";
import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import {
	songNameSchema,
	songPublicSchema,
	songSchema,
	songSlugSchema,
} from "./song-schema";

const NAME_MAX_LENGTH = 100;
const NAME_OVER_MAX = 101;
const SCHEMA_ERROR = /ParseError|Expected|invalid|literal|length|song\.validation\./;

describe("songNameSchema", () => {
	it("accepts valid names", () => {
		expect(Schema.decodeSync(songNameSchema)("Ab")).toBe("Ab");
		expect(Schema.decodeSync(songNameSchema)("A valid song name")).toBe("A valid song name");
		const maxLen = "x".repeat(NAME_MAX_LENGTH);
		expect(Schema.decodeSync(songNameSchema)(maxLen)).toBe(maxLen);
	});

	it("rejects leading/trailing spaces", () => {
		expect(() => Schema.decodeSync(songNameSchema)(" leading")).toThrow(SCHEMA_ERROR);
		expect(() => Schema.decodeSync(songNameSchema)("trailing ")).toThrow(SCHEMA_ERROR);
	});

	it("rejects names shorter than 2 chars", () => {
		expect(() => Schema.decodeSync(songNameSchema)("A")).toThrow(SCHEMA_ERROR);
		expect(() => Schema.decodeSync(songNameSchema)("")).toThrow(SCHEMA_ERROR);
	});

	it("rejects names longer than 100 chars", () => {
		expect(() => Schema.decodeSync(songNameSchema)("x".repeat(NAME_OVER_MAX))).toThrow(
			SCHEMA_ERROR,
		);
	});

	it("rejects consecutive spaces", () => {
		expect(() => Schema.decodeSync(songNameSchema)("two  spaces")).toThrow(SCHEMA_ERROR);
	});
});

describe("songSlugSchema", () => {
	it("accepts valid slugs", () => {
		expect(Schema.decodeSync(songSlugSchema)("my-song")).toBe("my-song");
		expect(Schema.decodeSync(songSlugSchema)("abc123")).toBe("abc123");
		expect(Schema.decodeSync(songSlugSchema)("a-b-c")).toBe("a-b-c");
	});

	it("rejects slugs starting or ending with dash", () => {
		expect(() => Schema.decodeSync(songSlugSchema)("-start")).toThrow(SCHEMA_ERROR);
		expect(() => Schema.decodeSync(songSlugSchema)("end-")).toThrow(SCHEMA_ERROR);
	});

	it("rejects slugs with uppercase or invalid chars", () => {
		expect(() => Schema.decodeSync(songSlugSchema)("My-Song")).toThrow(SCHEMA_ERROR);
		expect(() => Schema.decodeSync(songSlugSchema)("with space")).toThrow(SCHEMA_ERROR);
		expect(() => Schema.decodeSync(songSlugSchema)("under_score")).toThrow(SCHEMA_ERROR);
	});

	it("rejects consecutive dashes", () => {
		expect(() => Schema.decodeSync(songSlugSchema)("double--dash")).toThrow(SCHEMA_ERROR);
	});
});

describe("songPublicSchema", () => {
	const VALID_BASE = {
		song_id: "s1",
		song_name: "My Song",
		song_slug: "my-song",
		lyrics: "en",
		translations: [] as const,
		slide_order: ["s1"],
		slides: {
			s1: { slide_name: "Slide 1", field_data: { en: "verse 1" } },
		},
		key: makeNull(),
		scale: makeNull(),
		user_id: "u1",
		short_credit: makeNull(),
		long_credit: makeNull(),
		public_notes: makeNull(),
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
	};

	it("accepts valid song public when slide_order includes all slide keys", () => {
		const result = Schema.decodeSync(songPublicSchema)(VALID_BASE);
		expect(result.song_id).toBe("s1");
		expect(result.slides["s1"]).toBeDefined();
	});

	it("rejects when slide_order is missing a slide key", () => {
		const invalid = {
			...VALID_BASE,
			slide_order: [] as string[],
		};
		expect(() => Schema.decodeSync(songPublicSchema)(invalid)).toThrow(SCHEMA_ERROR);
	});

	it("rejects legacy slide field keys that do not match the song languages", () => {
		const invalid = {
			...VALID_BASE,
			slides: {
				s1: { slide_name: "Slide 1", field_data: { lyrics: "legacy value" } },
			},
		};
		expect(() => Schema.decodeSync(songPublicSchema)(invalid)).toThrow(SCHEMA_ERROR);
	});

});

describe("songSchema", () => {
	it("accepts valid internal song record", () => {
		const input = {
			song_id: "s1",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
		};
		const result = Schema.decodeSync(songSchema)(input);
		expect(result.song_id).toBe("s1");
	});

	it("accepts song with optional private_notes", () => {
		const input = {
			song_id: "s1",
			private_notes: "notes",
			created_at: "2024-01-01T00:00:00Z",
			updated_at: "2024-01-01T00:00:00Z",
		};
		const result = Schema.decodeSync(songSchema)(input);
		expect(result.private_notes).toBe("notes");
	});
});
