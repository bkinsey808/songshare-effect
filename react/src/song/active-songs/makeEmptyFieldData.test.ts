import { describe, expect, it } from "vitest";
import makeEmptyFieldData from "./makeEmptyFieldData";

describe("makeEmptyFieldData", () => {
    const CASES = [
        {
            name: "creates empty field for lyrics only",
            args: { lyrics: "en", script: undefined, translations: [] as readonly string[] },
            expected: { en: "" } as Record<string, string>,
        },
        {
            name: "includes script when provided",
            args: { lyrics: "en", script: "Latn", translations: [] as readonly string[] },
            expected: { en: "", Latn: "" } as Record<string, string>,
        },
        {
            name: "preserves translations order after lyrics and script",
            args: { lyrics: "en", script: "Latn", translations: ["fr", "es"] as const },
            expected: { en: "", Latn: "", fr: "", es: "" } as Record<string, string>,
        },
    ] as const;

    it.each(CASES)("$name", ({ args, expected }) => {
        // Act
        const result = makeEmptyFieldData(args);
        // Assert
        expect(result).toStrictEqual(expected);
    });
});
