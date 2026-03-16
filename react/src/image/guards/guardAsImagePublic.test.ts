import { describe, expect, it } from "vitest";

import guardAsImagePublic from "./guardAsImagePublic";

const CONTEXT = "test-context";
const IMAGE_ID = "img-1";
const USER_ID = "user-1";

const validImagePublic = {
	image_id: IMAGE_ID,
	user_id: USER_ID,
};

describe("guardAsImagePublic", () => {
	it("returns the value when it satisfies ImagePublic shape", () => {
		const result = guardAsImagePublic(validImagePublic, CONTEXT);

		expect(result).toStrictEqual(validImagePublic);
		expect(result.image_id).toBe(IMAGE_ID);
		expect(result.user_id).toBe(USER_ID);
	});

	it("throws TypeError with context when value is not a record", () => {
		expect(() => guardAsImagePublic("not-an-object", CONTEXT)).toThrow(TypeError);
		expect(() => guardAsImagePublic("not-an-object", CONTEXT)).toThrow(
			"[guardAsImagePublic] Invalid ImagePublic (test-context)",
		);
	});

	it("throws TypeError with context when value lacks image_id", () => {
		expect(() => guardAsImagePublic({ user_id: USER_ID }, CONTEXT)).toThrow(TypeError);
		expect(() => guardAsImagePublic({ user_id: USER_ID }, CONTEXT)).toThrow(/test-context/);
	});

	it("throws TypeError with context when value lacks user_id", () => {
		expect(() => guardAsImagePublic({ image_id: IMAGE_ID }, CONTEXT)).toThrow(TypeError);
	});

	it("throws TypeError with context when image_id is not a string", () => {
		expect(() => guardAsImagePublic({ image_id: 123, user_id: USER_ID }, CONTEXT)).toThrow(
			TypeError,
		);
	});

	it("throws TypeError with context when user_id is not a string", () => {
		expect(() => guardAsImagePublic({ image_id: IMAGE_ID, user_id: 0 }, CONTEXT)).toThrow(
			TypeError,
		);
	});
});
