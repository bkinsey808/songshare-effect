import { describe, expect, it } from "vitest";

import extractErrorStack from "./extractErrorStack";

describe("extractErrorStack", () => {
	it("returns stack from Error instances", () => {
		// Arrange
		const err = new Error("boom");
		err.stack = "boom-stack";

		// Act
		const result = extractErrorStack(err);

		// Assert
		expect(result).toBe("boom-stack");
	});

	it("returns stack from record payloads", () => {
		// Arrange
		const payload = { stack: "some-stack" };

		// Act
		// Use `undefined`-guarding call path — we pass `undefined` to exercise non-Error handling
		const result = extractErrorStack(payload);

		// Assert
		expect(result).toBe("some-stack");
	});

	it("returns fallback when no stack present", () => {
		// Arrange
		const emptyPayload = {};
		const fallback = "fallback";

		// Act
		const result1 = extractErrorStack(emptyPayload);
		const result2 = extractErrorStack(undefined, fallback);

		// Assert
		expect(result1).toBe("No stack trace");
		expect(result2).toBe(fallback);
	});
});
