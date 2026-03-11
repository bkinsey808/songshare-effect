import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import isSubscriptionStatus from "./isSubscriptionStatus";

const INVALID_PRIMITIVE = 42;

describe("isSubscriptionStatus", () => {
	it("returns true for each valid status", () => {
		expect(isSubscriptionStatus("SUBSCRIBED")).toBe(true);
		expect(isSubscriptionStatus("CHANNEL_ERROR")).toBe(true);
		expect(isSubscriptionStatus("TIMED_OUT")).toBe(true);
		expect(isSubscriptionStatus("CLOSED")).toBe(true);
	});

	it("returns false for invalid strings", () => {
		expect(isSubscriptionStatus("")).toBe(false);
		expect(isSubscriptionStatus("subscribed")).toBe(false);
		expect(isSubscriptionStatus("UNKNOWN")).toBe(false);
	});

	it("returns false for non-string values", () => {
		expect(isSubscriptionStatus(undefined)).toBe(false);
		expect(isSubscriptionStatus(makeNull())).toBe(false);
		expect(isSubscriptionStatus(INVALID_PRIMITIVE)).toBe(false);
	});
});
