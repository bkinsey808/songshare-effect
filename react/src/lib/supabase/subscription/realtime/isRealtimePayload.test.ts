import { describe, expect, it } from "vitest";

import type { RealtimePayload } from "../subscription-types";

import isRealtimePayload from "./isRealtimePayload";

// use a named constant to satisfy lint rules against magic numbers
const ARBITRARY_NUMBER = 123;

// Sanity check and shape verification identical to other guard tests

describe("isRealtimePayload module shape diagnostics", () => {
	it("exports the default function", () => {
		expect(typeof isRealtimePayload).toBe("function");
	});
});

// Behavior tests

describe("isRealtimePayload behavior", () => {
	it("rejects primitive and undefined values", () => {
		expect(isRealtimePayload(undefined)).toBe(false);
		expect(isRealtimePayload(ARBITRARY_NUMBER)).toBe(false);
		expect(isRealtimePayload("INSERT")).toBe(false);
	});

	it("rejects non-object values such as arrays", () => {
		expect(isRealtimePayload([])).toBe(false); // arrays are not records
	});

	it("rejects objects missing an eventType field", () => {
		expect(isRealtimePayload({})).toBe(false);
		expect(isRealtimePayload({ foo: "bar" })).toBe(false);
	});

	it("rejects when eventType is not a string", () => {
		expect(isRealtimePayload({ eventType: 42 })).toBe(false);
		expect(isRealtimePayload({ eventType: {} })).toBe(false);
	});

	it("rejects string eventType values that are not one of the allowed types", () => {
		expect(isRealtimePayload({ eventType: "insert" })).toBe(false); // lowercase
		expect(isRealtimePayload({ eventType: "UPDATE ", extra: true })).toBe(false); // trailing space
		expect(isRealtimePayload({ eventType: "UNKNOWN" })).toBe(false);
	});

	it("accepts valid realtime payloads regardless of additional properties", () => {
		const base: RealtimePayload = { eventType: "INSERT" };
		expect(isRealtimePayload(base)).toBe(true);

		expect(
			isRealtimePayload({
				eventType: "UPDATE",
				new: { foo: "bar" },
				old: { foo: "baz" },
				errors: undefined,
			}),
		).toBe(true);

		// Allowed values are case sensitive and exact
		expect(isRealtimePayload({ eventType: "DELETE", random: 123 })).toBe(true);
	});
});
