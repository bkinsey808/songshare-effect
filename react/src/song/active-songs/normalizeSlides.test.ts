import { describe, expect, it } from "vitest";
import normalizeSlides from "./normalizeSlides";

describe("normalizeSlides", () => {
    it("normalizes slide fields and includes background image metadata when valid", () => {
        const BG_WIDTH = 640;
        const BG_HEIGHT = 480;
        const BG_FPX = 0.25;
        const BG_FPY = 0.75;

        const rawSlides = {
            s1: {
                slide_name: "Title",
                field_data: { en: "line", script: "scr", fr: "fr text" },
                background_image_id: "bg-id",
                background_image_url: "https://example.com/img.png",
                background_image_width: BG_WIDTH,
                background_image_height: BG_HEIGHT,
                background_image_focal_point_x: BG_FPX,
                background_image_focal_point_y: BG_FPY,
            },
        } as Record<string, unknown>;

        const out = normalizeSlides({ rawSlides, lyrics: "en", script: "script", translations: ["fr"] });

        const { s1 } = out;
        expect(s1?.slide_name).toBe("Title");
        expect(s1?.field_data).toStrictEqual({ en: "line", script: "scr", fr: "fr text" });

        // Group background fields to reduce assertion count
        const expectedBg = {
            background_image_id: "bg-id",
            background_image_url: "https://example.com/img.png",
            background_image_width: BG_WIDTH,
            background_image_height: BG_HEIGHT,
            background_image_focal_point_x: BG_FPX,
            background_image_focal_point_y: BG_FPY,
        };
        const actualBg = {
            background_image_id: s1?.background_image_id,
            background_image_url: s1?.background_image_url,
            background_image_width: s1?.background_image_width,
            background_image_height: s1?.background_image_height,
            background_image_focal_point_x: s1?.background_image_focal_point_x,
            background_image_focal_point_y: s1?.background_image_focal_point_y,
        };

        expect(actualBg).toStrictEqual(expectedBg);
    });

    it("converts non-string field values to empty strings and uses legacy keys as fallback", () => {
        const rawSlides = {
            slideA: {
                slide_name: 123,
                field_data: {
                    en: 1,
                    sr: undefined,
                    fr: undefined,
                    // legacy keys
                    lyrics: "legacy lyrics",
                    script: "legacy script",
                    enTranslation: "legacy translate",
                },
            },
        } as Record<string, unknown>;

        const out = normalizeSlides({ rawSlides, lyrics: "en", script: "sr", translations: ["fr"] });

        // slide_name non-string => empty
        const { slideA } = out;
        expect(slideA?.slide_name).toBe("");

        // field keys exist and use legacy fallbacks where appropriate
        expect(slideA?.field_data).toStrictEqual({ en: "legacy lyrics", sr: "legacy script", fr: "legacy translate" });
    });
});
