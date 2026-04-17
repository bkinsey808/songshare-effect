import { type Json } from "@/shared/generated/supabaseTypes";
import normalizeSlideFieldData from "@/shared/song/normalizeSlideFieldData";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Sanitize an incoming `slides` value into a JSON-serializable structure
 * suitable for writing into the `song_public.slides` column. This strips
 * out non-record entries and coerces values to plain strings where needed.
 *
 * CRITICAL: Normalizes slide `field_data` to the current language-keyed shape
 * so writes stop persisting legacy keys like `lyrics`, `script`, and
 * `enTranslation`.
 *
 * This is intentionally a runtime guard that accepts `unknown` and returns
 * a safe plain-object `Json` value; it does not perform schema validation.
 *
 * @param slides - The raw `slides` value from the incoming payload.
 * @param lyrics - Required lyrics language code for the song.
 * @param script - Optional script language code for the song.
 * @param translations - Ordered translation language codes for the song.
 * @returns A plain JSON object that is safe to persist in the DB.
 */
export default function sanitizeSlidesForDb(
	slides: unknown,
	{
		lyrics = "",
		script,
		translations = [],
	}: Readonly<{
		lyrics?: string | undefined;
		script?: string | undefined;
		translations?: readonly string[] | undefined;
	}> = {},
): Json {
	if (isRecord(slides)) {
		const sanitized: Record<
			string,
			{
				slide_name: string;
				field_data: Record<string, string>;
				background_image_id?: string | undefined;
				background_image_url?: string | undefined;
				background_image_width?: number | undefined;
				background_image_height?: number | undefined;
				background_image_focal_point_x?: number | undefined;
				background_image_focal_point_y?: number | undefined;
			}
		> = {};

		for (const [slideKey, slideVal] of Object.entries(slides)) {
			if (isRecord(slideVal)) {
				const slideNameRaw = slideVal["slide_name"];
				const slideName = isString(slideNameRaw) ? slideNameRaw : "";

				const fieldDataRaw = slideVal["field_data"];
				const existingFieldData: Record<string, string> = isRecord(fieldDataRaw)
					? Object.fromEntries(
							Object.entries(fieldDataRaw).map(([fk, fv]) => [String(fk), isString(fv) ? fv : ""]),
						)
					: {};

				const fieldData = normalizeSlideFieldData({
					fieldData: existingFieldData,
					lyrics,
					script,
					translations,
				});
				const backgroundImageId = isString(slideVal["background_image_id"])
					? slideVal["background_image_id"]
					: undefined;
				const backgroundImageUrl = isString(slideVal["background_image_url"])
					? slideVal["background_image_url"]
					: undefined;
				const backgroundImageWidth =
					typeof slideVal["background_image_width"] === "number"
						? slideVal["background_image_width"]
						: undefined;
				const backgroundImageHeight =
					typeof slideVal["background_image_height"] === "number"
						? slideVal["background_image_height"]
						: undefined;
				const backgroundImageFocalPointX =
					typeof slideVal["background_image_focal_point_x"] === "number"
						? slideVal["background_image_focal_point_x"]
						: undefined;
				const backgroundImageFocalPointY =
					typeof slideVal["background_image_focal_point_y"] === "number"
						? slideVal["background_image_focal_point_y"]
						: undefined;

				sanitized[String(slideKey)] = {
					slide_name: slideName,
					field_data: fieldData,
					...(backgroundImageId === undefined ? {} : { background_image_id: backgroundImageId }),
					...(backgroundImageUrl === undefined ? {} : { background_image_url: backgroundImageUrl }),
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
		}

		return sanitized;
	}

	return {};
}
