import { isRight, isLeft } from "effect/Either";
import { describe, expect, it } from "vitest";

import { guardAsProvider, parseProvider, isProvider, Provider } from "./providers";

describe("providers utilities", () => {
	it("guardAsProvider accepts valid provider and throws on invalid", () => {
		expect(guardAsProvider(Provider.google)).toBe(Provider.google);
		expect(() => guardAsProvider("bad" as unknown)).toThrow(Error);
	});

	it("parseProvider returns Right for valid and Left for invalid", () => {
		const right = parseProvider(Provider.microsoft);
		expect(isRight(right)).toBe(true);
		const left = parseProvider("nope");
		expect(isLeft(left)).toBe(true);
	});

	it("isProvider returns true for known providers and false otherwise", () => {
		expect(isProvider("google")).toBe(true);
		expect(isProvider("unknown" as unknown)).toBe(false);
	});
});
