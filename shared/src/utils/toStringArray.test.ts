import { describe, expect, it } from "vitest";

import toStringArray from "./toStringArray";

const FIRST_NUM = 1;

describe("toStringArray", () => {
	const cases = [
		{
			name: "converts items",
			input: [FIRST_NUM, true, "a"] as const,
			expected: ["1", "true", "a"],
		},
		{ name: "non-array input", input: "nope" as unknown, expected: [] },
	];

	it.each(cases)(
		"$name",
		({ input, expected }: { input: unknown; expected: readonly string[] }) => {
			// Act
			const got = toStringArray(input);

			// Assert
			expect(got).toStrictEqual(expected);
		},
	);

	it("produces a mutable string array and coerces values from readonly input", () => {
		// Arrange
		const readonlyInput = [undefined, undefined] as const;

		// Act
		const out = toStringArray(readonlyInput);

		// Assert: coerced values and mutability
		expect(out).toStrictEqual(["undefined", "undefined"]);
		out.push("added");
		expect(out).toContain("added");
	});
});
