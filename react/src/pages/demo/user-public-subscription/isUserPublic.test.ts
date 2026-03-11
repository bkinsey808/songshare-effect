import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import { isUserPublic } from "./isUserPublic";

const INVALID_NUMBER = 42;

describe("isUserPublic", () => {
	it.each([
		[{ user_id: "u1", username: "alice" }],
		[{ user_id: "u2", username: "bob", extra: INVALID_NUMBER }],
	] as const)("returns true for valid object", (value) => {
		expect(isUserPublic(value)).toBe(true);
	});

	it.each([
		["null", makeNull()],
		["undefined", undefined],
		["string", "string"],
		["number", INVALID_NUMBER],
		["user_id not string", { user_id: 1, username: "alice" }],
		["user_id null", { user_id: makeNull(), username: "alice" }],
		["username not string", { user_id: "u1", username: INVALID_NUMBER }],
		["missing user_id", { username: "alice" }],
		["missing username", { user_id: "u1" }],
		["empty object", {}],
	] as const)("returns false for %s", (_description, value) => {
		expect(isUserPublic(value)).toBe(false);
	});
});
