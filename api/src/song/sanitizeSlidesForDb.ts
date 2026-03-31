import { type Json } from "@/shared/generated/supabaseTypes";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import ensureAllFieldsPresent from "./ensureAllFieldsPresent";

/**
 * Sanitize an incoming `slides` value into a JSON-serializable structure
 * suitable for writing into the `song_public.slides` column. This strips
 * out non-record entries and coerces values to plain strings where needed.
 *
 * CRITICAL: Normalizes field_data to ensure all fields from the fields array
 * are present in every slide's field_data. This prevents decode failures when
 * reading the data back, as the schema requires all fields to be present.
 *
 * This is intentionally a runtime guard that accepts `unknown` and returns
 * a safe plain-object `Json` value; it does not perform schema validation.
 *
 * @param slides - The raw `slides` value from the incoming payload.
 * @param fields - Array of field names that must be present in each slide's field_data.
 * @returns A plain JSON object that is safe to persist in the DB.
 */
export default function sanitizeSlidesForDb(slides: unknown, fields: readonly string[] = []): Json {
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

		// Normalize fields array - ensure it's an array of strings
		const normalizedFields = Array.isArray(fields)
			? fields.filter((field): field is string => typeof field === "string")
			: [];

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

				// CRITICAL: Ensure all fields from the fields array are present in field_data
				// This prevents decode failures when reading the data back
				const fieldData = ensureAllFieldsPresent(existingFieldData, normalizedFields);
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
