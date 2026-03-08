import { describe, expect, it } from "vitest";

import extractAddUserRequest from "./extractAddUserRequest";

describe("extractAddUserRequest", () => {
	it("returns a valid object when payload is correct", () => {
		const input = { followed_user_id: "user-abc" };
		const result = extractAddUserRequest(input);
		expect(result).toStrictEqual(input);
	});

	it("throws when given a non-object", () => {
		expect(() => extractAddUserRequest(undefined)).toThrow(TypeError);
		const notObject = 42;
		expect(() => extractAddUserRequest(notObject as unknown)).toThrow(
			"Request must be a valid object",
		);
	});

	it("throws when followed_user_id is missing", () => {
		expect(() => extractAddUserRequest({} as unknown)).toThrow(
			"Request must contain followed_user_id",
		);
	});

	it("throws when followed_user_id is not a string", () => {
		expect(() => extractAddUserRequest({ followed_user_id: 123 } as unknown)).toThrow(
			"followed_user_id must be a string",
		);
	});
});
