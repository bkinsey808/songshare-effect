import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import guardAsUserLibraryEntry from "./guardAsUserLibraryEntry";

const VALID_USER_ID = "u1";
const VALID_FOLLOWED_ID = "f1";
const VALID_CREATED_AT = "2024-01-01T00:00:00Z";
const VALID_ENTRY = {
	user_id: VALID_USER_ID,
	followed_user_id: VALID_FOLLOWED_ID,
	created_at: VALID_CREATED_AT,
};
const CONTEXT = "test-context";
const INVALID_PRIMITIVE = 42;

describe("guardAsUserLibraryEntry", () => {
	it("returns the value when valid", () => {
		const result = guardAsUserLibraryEntry(VALID_ENTRY, CONTEXT);
		expect(result).toStrictEqual(VALID_ENTRY);
	});

	it("returns entry with optional owner_username when present", () => {
		const withOptional = { ...VALID_ENTRY, owner_username: "bob" };
		const result = guardAsUserLibraryEntry(withOptional, CONTEXT);
		expect(result).toStrictEqual(withOptional);
	});

	it("uses default context when where is omitted", () => {
		expect(() => guardAsUserLibraryEntry(makeNull())).toThrow(
			"value must be a valid UserLibraryEntry",
		);
	});

	it("throws for null", () => {
		expect(() => guardAsUserLibraryEntry(makeNull(), CONTEXT)).toThrow(TypeError);
		expect(() => guardAsUserLibraryEntry(makeNull(), CONTEXT)).toThrow(
			`${CONTEXT} must be a valid UserLibraryEntry`,
		);
	});

	it("throws for undefined", () => {
		expect(() => guardAsUserLibraryEntry(undefined, CONTEXT)).toThrow(TypeError);
	});

	it("throws for primitive values", () => {
		expect(() => guardAsUserLibraryEntry(INVALID_PRIMITIVE, CONTEXT)).toThrow(TypeError);
		expect(() => guardAsUserLibraryEntry("string", CONTEXT)).toThrow(TypeError);
	});

	it("throws for object missing required fields", () => {
		expect(() => guardAsUserLibraryEntry({}, CONTEXT)).toThrow(TypeError);
		expect(() =>
			guardAsUserLibraryEntry({ user_id: VALID_USER_ID }, CONTEXT),
		).toThrow(TypeError);
		expect(() =>
			guardAsUserLibraryEntry(
				{ user_id: VALID_USER_ID, followed_user_id: VALID_FOLLOWED_ID },
				CONTEXT,
			),
		).toThrow(TypeError);
	});

	it("throws for object with non-string created_at", () => {
		expect(() =>
			guardAsUserLibraryEntry(
				{ ...VALID_ENTRY, created_at: 123 },
				CONTEXT,
			),
		).toThrow(TypeError);
	});
});
