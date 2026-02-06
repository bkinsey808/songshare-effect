import { describe, expect, it } from "vitest";

import parseUserSessionData from "./parseUserSessionData";

describe("parseUserSessionData", () => {
	it("returns undefined for undefined", () => {
		expect(parseUserSessionData(undefined)).toBeUndefined();
	});

	it("returns undefined for empty object", () => {
		expect(parseUserSessionData({})).toBeUndefined();
	});

	it("returns payload if it matches UserSessionData (has user property)", () => {
		const payload = { user: { user_id: "123" } };
		expect(parseUserSessionData(payload)).toStrictEqual(payload);
	});

	it("returns data if wrapped in a success object", () => {
		const data = { user: { user_id: "123" } };
		const payload = { success: true, data };
		expect(parseUserSessionData(payload)).toStrictEqual(data);
	});

	it("returns undefined if wrapped in success object but data is invalid", () => {
		const payload = { success: true, data: { not_user: true } };
		expect(parseUserSessionData(payload)).toBeUndefined();
	});

	it("returns undefined for non-objects", () => {
		expect(parseUserSessionData("string")).toBeUndefined();
		const magicNumber = 123;
		expect(parseUserSessionData(magicNumber)).toBeUndefined();
		expect(parseUserSessionData(true)).toBeUndefined();
	});
});
