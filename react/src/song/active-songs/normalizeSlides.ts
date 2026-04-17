import normalizeSlideFieldData from "@/shared/song/normalizeSlideFieldData";
import isRecord from "@/shared/type-guards/isRecord";
import type { NormalizedSlide } from "./NormalizedSlide.type";

/**
 * Convert a raw slides map into a typed map of `NormalizedSlide` objects.
 *
 * This function performs lightweight defensive normalization for each slide:
 * - Coerces missing values to safe defaults (empty strings / undefined)
 * - Ensures `field_data` values are strings
 * - Normalizes background image metadata where present
 * - Delegates per-field normalization to `normalizeSlideFieldData`
 *
 * @param rawSlides - Raw slides (usually from Supabase) keyed by slide id
 * @param lyrics - Lyrics language code used when normalizing fields
 * @param script - Optional script language code used when normalizing fields
 * @param translations - List of translation language codes used when normalizing fields
 * @returns A map of slide id to `NormalizedSlide` ready for application use
 */
export default function normalizeSlides({
    rawSlides,
    lyrics,
    script,
    translations,
}: Readonly<{
    rawSlides: Record<string, unknown>;
    lyrics: readonly string[];
    script?: readonly string[] | undefined;
    translations: readonly string[];
}>): Record<string, NormalizedSlide> {
    const normalizedSlides: Record<string, NormalizedSlide> = {};

    for (const key of Object.keys(rawSlides)) {
        const slide = isRecord(rawSlides[key]) ? rawSlides[key] : {};
        const rawFieldData = isRecord(slide["field_data"]) ? slide["field_data"] : {};
        const fieldData = Object.fromEntries(
            Object.entries(rawFieldData).map(([fieldKey, value]) => [
                String(fieldKey),
                typeof value === "string" ? value : "",
            ]),
        );
        const backgroundImageWidth =
            typeof slide["background_image_width"] === "number"
                ? slide["background_image_width"]
                : undefined;
        const backgroundImageHeight =
            typeof slide["background_image_height"] === "number"
                ? slide["background_image_height"]
                : undefined;
        const backgroundImageFocalPointX =
            typeof slide["background_image_focal_point_x"] === "number"
                ? slide["background_image_focal_point_x"]
                : undefined;
        const backgroundImageFocalPointY =
            typeof slide["background_image_focal_point_y"] === "number"
                ? slide["background_image_focal_point_y"]
                : undefined;

        normalizedSlides[key] = {
            slide_name: typeof slide["slide_name"] === "string" ? slide["slide_name"] : "",
            field_data: normalizeSlideFieldData({
                fieldData,
                lyrics,
                script,
                translations,
            }),
            ...(typeof slide["background_image_id"] === "string" &&
            typeof slide["background_image_url"] === "string"
                ? {
                        background_image_id: slide["background_image_id"],
                        background_image_url: slide["background_image_url"],
                    }
                : {}),
            ...(backgroundImageWidth === undefined ? {} : { background_image_width: backgroundImageWidth }),
            ...(backgroundImageHeight === undefined ? {} : { background_image_height: backgroundImageHeight }),
            ...(backgroundImageFocalPointX === undefined
                ? {}
                : { background_image_focal_point_x: backgroundImageFocalPointX }),
            ...(backgroundImageFocalPointY === undefined
                ? {}
                : { background_image_focal_point_y: backgroundImageFocalPointY }),
        };
    }

    return normalizedSlides;
}
