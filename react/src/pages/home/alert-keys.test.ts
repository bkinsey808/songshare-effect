import { describe, expect, it } from "vitest";

import { ZERO } from "@/shared/constants/shared-constants";

import {
	ALL_ALERT_TYPES,
	DELETE_SUCCESS,
	REGISTERED_SUCCESS,
	SIGNED_IN_SUCCESS,
	SIGN_OUT_SUCCESS,
	UNAUTHORIZED_ACCESS,
} from "./alert-keys";

describe("alert-keys", () => {
	it.each([
		["DELETE_SUCCESS", DELETE_SUCCESS],
		["SIGN_OUT_SUCCESS", SIGN_OUT_SUCCESS],
		["SIGNED_IN_SUCCESS", SIGNED_IN_SUCCESS],
		["REGISTERED_SUCCESS", REGISTERED_SUCCESS],
		["UNAUTHORIZED_ACCESS", UNAUTHORIZED_ACCESS],
	] as const)("exports %s as non-empty string", (_name, value) => {
		expect(value).toBeDefined();
		expect(typeof value).toBe("string");
		expect(value.length).toBeGreaterThan(ZERO);
	});

	it("all alert types includes each exported constant", () => {
		expect(ALL_ALERT_TYPES).toContain(DELETE_SUCCESS);
		expect(ALL_ALERT_TYPES).toContain(SIGN_OUT_SUCCESS);
		expect(ALL_ALERT_TYPES).toContain(SIGNED_IN_SUCCESS);
		expect(ALL_ALERT_TYPES).toContain(REGISTERED_SUCCESS);
		expect(ALL_ALERT_TYPES).toContain(UNAUTHORIZED_ACCESS);
		expect(ALL_ALERT_TYPES.length).toBeGreaterThan(ZERO);
	});
});
