import { describe, expect, it } from "vitest";

import makeNull from "@/shared/test-utils/makeNull.test-util";

import extractErrorMessage from "./extractErrorMessage";

const NUM_PRIMITIVE = 42;

describe("extractErrorMessage", () => {
	const payload = { error: { code: 500 } };

	const noFallbackCases = [
		{ name: "null input", input: makeNull(), expected: undefined },
		{ name: "undefined input", input: undefined, expected: undefined },
		{ name: "Error instance", input: new Error("error msg"), expected: "error msg" },
		{ name: "plain string", input: "plain string", expected: "plain string" },
		{ name: "object with error prop", input: { error: "API error" }, expected: "API error" },
		{
			name: "object with message prop",
			input: { message: "Something failed" },
			expected: "Something failed",
		},
		{ name: "error and message present", input: { error: "err", message: "msg" }, expected: "err" },
		{ name: "nested payload", input: payload, expected: JSON.stringify(payload) },
		{ name: "numeric primitive", input: NUM_PRIMITIVE, expected: "42" },
		{ name: "boolean true", input: true, expected: "true" },
	];

	it.each(noFallbackCases)("for $name returns expected", ({ input, expected }) => {
		// Act
		const actual = extractErrorMessage(input);

		// Assert
		expect(actual).toBe(expected);
	});

	const withFallbackCases = [
		{ name: "null with fallback", input: makeNull(), fallback: "fallback", expected: "fallback" },
		{ name: "undefined with default", input: undefined, fallback: "default", expected: "default" },
		{ name: "empty object with fallback", input: {}, fallback: "fallback", expected: "fallback" },
	];

	it.each(withFallbackCases)(
		"for $name returns fallback when appropriate",
		({ input, fallback, expected }) => {
			// Act
			const actual = extractErrorMessage(input, fallback);

			// Assert
			expect(actual).toBe(expected);
		},
	);
});
