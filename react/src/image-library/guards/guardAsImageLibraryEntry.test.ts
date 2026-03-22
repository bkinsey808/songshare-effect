import { describe, expect, it, vi } from "vitest";

import guardAsImageLibraryEntry from "./guardAsImageLibraryEntry";

vi.mock("@/react/lib/utils/clientLogger");

const CONTEXT = "test-context";
const IMAGE_ID = "img-1";
const USER_ID = "user-1";
const NOT_A_STRING_NUM = 42;

const validEntry = {
	user_id: USER_ID,
	image_id: IMAGE_ID,
	created_at: "2026-01-01T00:00:00Z",
};

describe("guardAsImageLibraryEntry", () => {
	it("returns the value when it satisfies ImageLibraryEntry shape", () => {
		const result = guardAsImageLibraryEntry(validEntry, CONTEXT);

		expect(result).toStrictEqual(validEntry);
		expect(result.user_id).toBe(USER_ID);
		expect(result.image_id).toBe(IMAGE_ID);
	});

	it("throws TypeError with context when value is not a record", () => {
		expect(() => guardAsImageLibraryEntry("not-an-object", CONTEXT)).toThrow(TypeError);
		expect(() => guardAsImageLibraryEntry("not-an-object", CONTEXT)).toThrow(
			"Expected valid ImageLibraryEntry in test-context",
		);
	});

	it("throws TypeError with context when value lacks user_id", () => {
		expect(() =>
			guardAsImageLibraryEntry(
				{ image_id: IMAGE_ID, created_at: "" },
				CONTEXT,
			),
		).toThrow(TypeError);
		expect(() =>
			guardAsImageLibraryEntry(
				{ image_id: IMAGE_ID, created_at: "" },
				CONTEXT,
			),
		).toThrow(/test-context/);
	});

	it("throws TypeError with context when value lacks image_id", () => {
		expect(() =>
			guardAsImageLibraryEntry(
				{ user_id: USER_ID, created_at: "" },
				CONTEXT,
			),
		).toThrow(TypeError);
	});

	it("throws TypeError with context when user_id is not a string", () => {
		expect(() =>
			guardAsImageLibraryEntry(
				{
					user_id: NOT_A_STRING_NUM,
					image_id: IMAGE_ID,
					created_at: "",
				},
				CONTEXT,
			),
		).toThrow(TypeError);
	});

	it("throws TypeError with context when image_id is not a string", () => {
		expect(() =>
			guardAsImageLibraryEntry(
				{
					user_id: USER_ID,
					image_id: NOT_A_STRING_NUM,
					created_at: "",
				},
				CONTEXT,
			),
		).toThrow(TypeError);
	});

	it("uses default context when not provided", () => {
		expect(() => guardAsImageLibraryEntry("bad")).toThrow(
			"Expected valid ImageLibraryEntry in ImageLibraryEntry",
		);
	});
});
