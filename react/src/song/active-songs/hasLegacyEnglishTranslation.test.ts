import { describe, expect, it } from "vitest";
import hasLegacyEnglishTranslation from "./hasLegacyEnglishTranslation";

describe("hasLegacyEnglishTranslation", () => {
    const CASES = [
        {
            name: "returns false for non-record slide values",
            rawSlides: { s1: 1, s2: "x" } as Record<string, unknown>,
            expected: false,
        },
        {
            name: "returns false when field_data missing or not a record",
            rawSlides: { slideA: { not_field_data: {} } } as Record<string, unknown>,
            expected: false,
        },
        {
            name: "returns false when enTranslation is not a string",
            rawSlides: { slideB: { field_data: { enTranslation: 123 } } } as Record<string, unknown>,
            expected: false,
        },
        {
            name: "returns false when enTranslation is whitespace only",
            rawSlides: { slideC: { field_data: { enTranslation: "   " } } } as Record<string, unknown>,
            expected: false,
        },
        {
            name: "returns true when a slide contains a non-empty enTranslation",
            rawSlides: { slideD: { field_data: { enTranslation: "Some legacy text" } } } as Record<string, unknown>,
            expected: true,
        },
        {
            name: "returns true when mixed slides include a valid enTranslation",
            rawSlides: {
                s1: { field_data: { enTranslation: "" } },
                s2: { field_data: { enTranslation: "valid" } },
            } as Record<string, unknown>,
            expected: true,
        },
    ] as const;

    it.each(CASES)("$name", ({ rawSlides, expected }) => {
        // Act
        const result = hasLegacyEnglishTranslation(rawSlides);
        // Assert
        expect(result).toBe(expected);
    });
});

