import { describe, expect, it } from "vitest";

import {
	DELETE_SUCCESS,
	REGISTERED_SUCCESS,
	SIGNED_IN_SUCCESS,
	SIGN_OUT_SUCCESS,
	UNAUTHORIZED_ACCESS,
} from "@/react/pages/home/alert-keys";

import isAlertType from "./isAlertType";

describe("isAlertType", () => {
	it("returns true for each valid alert type", () => {
		expect(isAlertType(DELETE_SUCCESS)).toBe(true);
		expect(isAlertType(SIGN_OUT_SUCCESS)).toBe(true);
		expect(isAlertType(SIGNED_IN_SUCCESS)).toBe(true);
		expect(isAlertType(REGISTERED_SUCCESS)).toBe(true);
		expect(isAlertType(UNAUTHORIZED_ACCESS)).toBe(true);
	});

	it("returns false for empty string", () => {
		expect(isAlertType("")).toBe(false);
	});

	it("returns false for invalid alert strings", () => {
		expect(isAlertType("unknown")).toBe(false);
		expect(isAlertType("deleteSuccessX")).toBe(false);
		expect(isAlertType("DELETE_SUCCESS")).toBe(false);
	});
});
