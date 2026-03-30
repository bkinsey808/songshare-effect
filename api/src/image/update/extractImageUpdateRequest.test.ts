import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractImageUpdateRequest from "./extractImageUpdateRequest";

const INVALID_NON_OBJECT = 42;
const INVALID_IMAGE_ID = 123;

describe("extractImageUpdateRequest", () => {
	it("returns valid request when payload has all required fields", () => {
		const input = {
			image_id: "img-1",
			image_name: "My Image",
			description: "A description",
			alt_text: "Alt text",
			focal_point_x: 25,
			focal_point_y: 75,
		};
		const result = extractImageUpdateRequest(input);
		expect(result).toStrictEqual({
			image_id: "img-1",
			image_name: "My Image",
			description: "A description",
			alt_text: "Alt text",
			focal_point_x: 25,
			focal_point_y: 75,
			tags: undefined,
		});
	});

	it("trims whitespace from all string fields", () => {
		const result = extractImageUpdateRequest({
			image_id: "  img-1  ",
			image_name: "  Name  ",
			description: "  Desc  ",
			alt_text: "  Alt  ",
			focal_point_x: 40,
			focal_point_y: 60,
		});
		expect(result).toStrictEqual({
			image_id: "img-1",
			image_name: "Name",
			description: "Desc",
			alt_text: "Alt",
			focal_point_x: 40,
			focal_point_y: 60,
			tags: undefined,
		});
	});

	it("throws when given a non-object", () => {
		expect(() => extractImageUpdateRequest(makeNull())).toThrow(TypeError);
		expect(() => extractImageUpdateRequest(INVALID_NON_OBJECT as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when image_id is missing", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_name: "Name",
				description: "Desc",
				alt_text: "Alt",
				focal_point_x: 50,
				focal_point_y: 50,
			} as unknown),
		).toThrow("image_id must be a non-empty string");
	});

	it("throws when image_name is missing", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: "img-1",
				description: "Desc",
				alt_text: "Alt",
				focal_point_x: 50,
				focal_point_y: 50,
			} as unknown),
		).toThrow("image_name must be a string");
	});

	it("throws when description is missing", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: "img-1",
				image_name: "Name",
				alt_text: "Alt",
				focal_point_x: 50,
				focal_point_y: 50,
			} as unknown),
		).toThrow("description must be a string");
	});

	it("throws when alt_text is missing", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: "img-1",
				image_name: "Name",
				description: "Desc",
				focal_point_x: 50,
				focal_point_y: 50,
			} as unknown),
		).toThrow("alt_text must be a string");
	});

	it("throws when image_id is not a string", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: INVALID_IMAGE_ID,
				image_name: "Name",
				description: "Desc",
				alt_text: "Alt",
				focal_point_x: 50,
				focal_point_y: 50,
			} as unknown),
		).toThrow("image_id must be a non-empty string");
	});

	it("throws when focal_point_x is missing", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: "img-1",
				image_name: "Name",
				description: "Desc",
				alt_text: "Alt",
				focal_point_y: 50,
			} as unknown),
		).toThrow("focal_point_x must be a number between 0 and 100");
	});

	it("throws when focal_point_y is out of range", () => {
		expect(() =>
			extractImageUpdateRequest({
				image_id: "img-1",
				image_name: "Name",
				description: "Desc",
				alt_text: "Alt",
				focal_point_x: 50,
				focal_point_y: 101,
			} as unknown),
		).toThrow("focal_point_y must be a number between 0 and 100");
	});
});
