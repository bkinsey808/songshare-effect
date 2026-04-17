import { describe, expect, it } from "vitest";
import { LEGACY_TRANSLATION_LANGUAGE } from "./constants";
import getNormalizedTranslations from "./getNormalizedTranslations";

const INVALID_TRANSLATION = 123;

describe("getNormalizedTranslations", () => {
    const CASES = [
        {
            name: "returns filtered translations when present on the song",
            song: { translations: ["es", "fr", INVALID_TRANSLATION, undefined] } as Record<string, unknown>,
            rawSlides: {} as Record<string, unknown>,
            lyrics: "pt",
            expected: ["es", "fr"] as readonly string[],
        },
        {
            name: "falls back to legacy english when translations missing and slides contain legacy enTranslation",
            song: {} as Record<string, unknown>,
            rawSlides: { slideA: { field_data: { enTranslation: " Some legacy text " } } } as Record<string, unknown>,
            lyrics: "pt",
            expected: [LEGACY_TRANSLATION_LANGUAGE] as readonly string[],
        },
        {
            name: "does not return legacy translation when lyrics equals legacy language",
            song: {} as Record<string, unknown>,
            rawSlides: { slideB: { field_data: { enTranslation: "legacy" } } } as Record<string, unknown>,
            lyrics: LEGACY_TRANSLATION_LANGUAGE,
            expected: [] as readonly string[],
        },
        {
            name: "returns empty array when there are no translations and no legacy translations",
            song: {} as Record<string, unknown>,
            rawSlides: { slideC: { field_data: { enTranslation: "" } } } as Record<string, unknown>,
            lyrics: "pt",
            expected: [] as readonly string[],
        },
    ] as const;

    it.each(CASES)("$name", ({ song, rawSlides, lyrics, expected }) => {
        // Act
        const result = getNormalizedTranslations({ song, rawSlides, lyrics });
        // Assert
        expect(result).toStrictEqual(expected);
    });
});
