import { describe, expect, it } from "vitest";

import unwrapError from "./unwrapError";

describe("unwrapError", () => {
	const unwrapCases = [
		{ name: "cause shape", input: { cause: new Error("cause") } },
		{ name: "error shape", input: { error: new Error("error") } },
		{ name: "failure.cause shape", input: { failure: { cause: new Error("f") } } },
	];

	it.each(unwrapCases)("unwraps $name", ({ input }: { input: unknown }) => {
		// Act & Assert
		expect(unwrapError(input)).toBeInstanceOf(Error);
	});

	it("returns non-object unchanged", () => {
		// Arrange
		const valueString = "nope";

		// Act & Assert
		expect(unwrapError(valueString)).toBe(valueString);
	});
});
