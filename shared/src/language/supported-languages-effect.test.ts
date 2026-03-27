import { isLeft, isRight } from "effect/Either";
import { describe, expect, it } from "vitest";

import { SupportedLanguage } from "@/shared/language/supported-languages";
import makeNull from "@/shared/test-utils/makeNull.test-util";

import {
	guardAsSupportedLanguage,
	isSupportedLanguage,
	parseSupportedLanguage,
} from "./supported-languages-effect";

const INVALID_PRIMITIVE = 42;

describe("isSupportedLanguage", () => {
	it("returns true for each supported language", () => {
		// Assert
		expect(isSupportedLanguage(SupportedLanguage.en)).toBe(true);
		expect(isSupportedLanguage(SupportedLanguage.es)).toBe(true);
		expect(isSupportedLanguage(SupportedLanguage.zh)).toBe(true);
	});

	it("returns false for invalid values", () => {
		// Assert
		expect(isSupportedLanguage(makeNull())).toBe(false);
		expect(isSupportedLanguage(undefined)).toBe(false);
		expect(isSupportedLanguage("fr")).toBe(false);
		expect(isSupportedLanguage(INVALID_PRIMITIVE)).toBe(false);
	});
});

describe("guardAsSupportedLanguage", () => {
	it("returns value for valid language", () => {
		// Assert
		expect(guardAsSupportedLanguage(SupportedLanguage.en)).toBe(SupportedLanguage.en);
	});

	it("throws for invalid value", () => {
		// Assert
		expect(() => guardAsSupportedLanguage("xx")).toThrow(/Expected|expected/i);
		expect(() => guardAsSupportedLanguage(makeNull())).toThrow(/Expected|expected/i);
	});
});

describe("parseSupportedLanguage", () => {
	it("returns Right for valid language", () => {
		// Act
		const result = parseSupportedLanguage(SupportedLanguage.zh);
		// Assert
		expect(isRight(result)).toBe(true);
	});

	it("returns Left for invalid value", () => {
		// Act
		const result = parseSupportedLanguage("invalid");
		// Assert
		expect(isLeft(result)).toBe(true);
	});
});
