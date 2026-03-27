import { describe, expect, it } from "vitest";

import { ONE, THREE, TWO } from "@/shared/constants/shared-constants";

import computeParams from "./computeParams";

describe("computeParams", () => {
	it("returns empty object for empty input", () => {
		// Act
		const result = computeParams({});

		// Assert
		expect(result).toStrictEqual({});
	});

	it("excludes the 'key' property and includes others", () => {
		// Arrange
		const input = { key: "some.key", name: "Alice", count: THREE } as Record<string, unknown>;

		// Act
		const result = computeParams(input);

		// Assert
		expect(result).toStrictEqual({ name: "Alice", count: THREE });
	});

	it("preserves values of various types", () => {
		// Arrange
		const input = {
			key: "kk",
			arr: [ONE, TWO],
			nested: { aa: ONE },
			nil: undefined,
		} as Record<string, unknown>;

		// Act
		const result = computeParams(input);

		// Assert
		expect(result).toStrictEqual({
			arr: [ONE, TWO],
			nested: { aa: ONE },
			nil: undefined,
		});
	});

	it("does not mutate the input object", () => {
		// Arrange
		const input = { key: "kk", aa: ONE } as Record<string, unknown>;
		const copy = { ...input };

		// Act
		computeParams(input);

		// Assert
		expect(input).toStrictEqual(copy);
	});
});
