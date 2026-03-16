import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractAddImageRequest from "./extractAddImageRequest";

const INVALID_NON_OBJECT = 42;
const INVALID_IMAGE_ID = 123;

describe("extractAddImageRequest", () => {
	it("returns valid request when payload has image_id", () => {
		const input = { image_id: "img-abc" };
		const result = extractAddImageRequest(input);
		expect(result).toStrictEqual({ image_id: "img-abc" });
	});

	it("trims whitespace from image_id", () => {
		const result = extractAddImageRequest({ image_id: "  img-xyz  " });
		expect(result).toStrictEqual({ image_id: "img-xyz" });
	});

	it("throws when given a non-object", () => {
		expect(() => extractAddImageRequest(makeNull())).toThrow(TypeError);
		expect(() => extractAddImageRequest(INVALID_NON_OBJECT as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when image_id is missing", () => {
		expect(() => extractAddImageRequest({} as unknown)).toThrow("Request must contain image_id");
	});

	it("throws when image_id is not a string", () => {
		expect(() => extractAddImageRequest({ image_id: INVALID_IMAGE_ID } as unknown)).toThrow(
			"image_id must be a non-empty string",
		);
	});

	it("throws when image_id is empty string", () => {
		expect(() => extractAddImageRequest({ image_id: "" })).toThrow(
			"image_id must be a non-empty string",
		);
	});

	it("throws when image_id is whitespace-only", () => {
		expect(() => extractAddImageRequest({ image_id: "   " })).toThrow(
			"image_id must be a non-empty string",
		);
	});
});
