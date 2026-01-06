import { describe, it, expect } from "vitest";

import computeParams from "./computeParams";

const ONE = 1;
const TWO = 2;
const THREE = 3;

describe("computeParams", () => {
	it("returns empty object for empty input", () => {
		expect(computeParams({})).toStrictEqual({});
	});

	it("excludes the 'key' property and includes others", () => {
		const input = { key: "some.key", name: "Alice", count: THREE } as Record<string, unknown>;
		expect(computeParams(input)).toStrictEqual({ name: "Alice", count: THREE });
	});

	it("preserves values of various types", () => {
		const input = {
			key: "kk",
			arr: [ONE, TWO],
			nested: { aa: ONE },
			nil: undefined,
		} as Record<string, unknown>;
		expect(computeParams(input)).toStrictEqual({
			arr: [ONE, TWO],
			nested: { aa: ONE },
			nil: undefined,
		});
	});

	it("does not mutate the input object", () => {
		const input = { key: "kk", aa: ONE } as Record<string, unknown>;
		const copy = { ...input };
		computeParams(input);
		expect(input).toStrictEqual(copy);
	});
});
