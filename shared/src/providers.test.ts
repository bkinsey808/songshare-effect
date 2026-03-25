import { isLeft, isRight } from "effect/Either";
import { describe, expect, it } from "vitest";

import { guardAsProvider, isProvider, parseProvider, Provider } from "./providers";

describe("providers utilities", () => {
	it("guardAsProvider accepts valid provider and throws on invalid", () => {
		// Assert
		expect(guardAsProvider(Provider.google)).toBe(Provider.google);
		expect(() => guardAsProvider("bad" as unknown)).toThrow(Error);
	});

	it("parseProvider returns Right for valid and Left for invalid", () => {
		// Arrange
		const right = parseProvider(Provider.microsoft);
		const left = parseProvider("nope");

		// Assert
		expect(isRight(right)).toBe(true);
		expect(isLeft(left)).toBe(true);
	});

	it("isProvider returns true for known providers and false otherwise", () => {
		// Assert
		expect(isProvider("google")).toBe(true);
		expect(isProvider("unknown" as unknown)).toBe(false);
	});
});
