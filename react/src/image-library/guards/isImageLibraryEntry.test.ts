import { describe, expect, it } from "vitest";

import getNull from "@/react/image/guards/guards.test-util";

import isImageLibraryEntry from "./isImageLibraryEntry";

const IMAGE_ID = "img-1";
const USER_ID = "user-1";
const NOT_A_STRING_NUM = 42;

describe("isImageLibraryEntry", () => {
	it("returns true for a valid ImageLibraryEntry-shaped object", () => {
		expect(
			isImageLibraryEntry({
				user_id: USER_ID,
				image_id: IMAGE_ID,
				created_at: "2026-01-01T00:00:00Z",
			}),
		).toBe(true);
	});

	it("returns false when value is null", () => {
		expect(isImageLibraryEntry(getNull())).toBe(false);
	});

	it("returns false when value is undefined", () => {
		expect(isImageLibraryEntry(undefined)).toBe(false);
	});

	it("returns false when value is an array", () => {
		expect(
			isImageLibraryEntry([
				{ user_id: USER_ID, image_id: IMAGE_ID, created_at: "" },
			]),
		).toBe(false);
	});

	it("returns false when value is a string", () => {
		expect(isImageLibraryEntry("entry")).toBe(false);
	});

	it("returns false when value is a number", () => {
		expect(isImageLibraryEntry(NOT_A_STRING_NUM)).toBe(false);
	});

	it("returns false when user_id is missing", () => {
		expect(
			isImageLibraryEntry({ image_id: IMAGE_ID, created_at: "" }),
		).toBe(false);
	});

	it("returns false when image_id is missing", () => {
		expect(
			isImageLibraryEntry({ user_id: USER_ID, created_at: "" }),
		).toBe(false);
	});

	it("returns false when user_id is not a string", () => {
		expect(
			isImageLibraryEntry({
				user_id: NOT_A_STRING_NUM,
				image_id: IMAGE_ID,
				created_at: "",
			}),
		).toBe(false);
	});

	it("returns false when image_id is not a string", () => {
		expect(
			isImageLibraryEntry({
				user_id: USER_ID,
				image_id: NOT_A_STRING_NUM,
				created_at: "",
			}),
		).toBe(false);
	});
});
