import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import { getUserIdFromAppMetadata } from "./getSupabaseUserToken";

const USER_ID = "usr-123";

describe("getUserIdFromAppMetadata", () => {
	it("returns user_id when structure is valid", () => {
		const meta = { user: { user_id: USER_ID } };
		expect(getUserIdFromAppMetadata(meta)).toBe(USER_ID);
	});

	it("returns undefined for non-record meta", () => {
		expect(getUserIdFromAppMetadata(makeNull())).toBeUndefined();
		expect(getUserIdFromAppMetadata(undefined)).toBeUndefined();
		expect(getUserIdFromAppMetadata("string")).toBeUndefined();
	});

	it("returns undefined when user is not a record", () => {
		expect(getUserIdFromAppMetadata({ user: "string" })).toBeUndefined();
		expect(getUserIdFromAppMetadata({ user: 42 })).toBeUndefined();
	});

	it("returns undefined when user_id is missing", () => {
		expect(getUserIdFromAppMetadata({ user: {} })).toBeUndefined();
	});

	it("returns undefined when user_id is not a string", () => {
		expect(getUserIdFromAppMetadata({ user: { user_id: 42 } })).toBeUndefined();
	});
});
