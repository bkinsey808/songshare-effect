import { describe, expect, it } from "vitest";

import getNull from "./guards.test-util";
import isImagePublic from "./isImagePublic";

const IMAGE_ID = "img-1";
const USER_ID = "user-1";
const NOT_A_STRING_NUM = 42;

describe("isImagePublic", () => {
	it("returns true for a valid ImagePublic-shaped object", () => {
		expect(
			isImagePublic({
				image_id: IMAGE_ID,
				user_id: USER_ID,
			}),
		).toBe(true);
	});

	it("returns false when value is null", () => {
		expect(isImagePublic(getNull())).toBe(false);
	});

	it("returns false when value is undefined", () => {
		expect(isImagePublic(undefined)).toBe(false);
	});

	it("returns false when value is an array", () => {
		expect(isImagePublic([{ image_id: IMAGE_ID, user_id: USER_ID }])).toBe(false);
	});

	it("returns false when value is a string", () => {
		expect(isImagePublic("image")).toBe(false);
	});

	it("returns false when value is a number", () => {
		expect(isImagePublic(NOT_A_STRING_NUM)).toBe(false);
	});

	it("returns false when image_id is missing", () => {
		expect(isImagePublic({ user_id: USER_ID })).toBe(false);
	});

	it("returns false when user_id is missing", () => {
		expect(isImagePublic({ image_id: IMAGE_ID })).toBe(false);
	});

	it("returns false when image_id is not a string", () => {
		expect(isImagePublic({ image_id: 123, user_id: USER_ID })).toBe(false);
	});

	it("returns false when user_id is not a string", () => {
		expect(isImagePublic({ image_id: IMAGE_ID, user_id: NOT_A_STRING_NUM })).toBe(false);
	});
});
