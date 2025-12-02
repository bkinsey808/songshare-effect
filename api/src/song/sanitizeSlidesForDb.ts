import { type Json } from "@/shared/generated/supabaseTypes";
import { isRecord, isString } from "@/shared/utils/typeGuards";

/**
 * Sanitize an incoming `slides` value into a JSON-serializable structure
 * suitable for writing into the `song_public.slides` column. This strips
 * out non-record entries and coerces values to plain strings where needed.
 *
 * This is intentionally a runtime guard that accepts `unknown` and returns
 * a safe plain-object `Json` value; it does not perform schema validation.
 *
 * @param slides - The raw `slides` value from the incoming payload.
 * @returns A plain JSON object that is safe to persist in the DB.
 */
export default function sanitizeSlidesForDb(slides: unknown): Json {
	if (isRecord(slides)) {
		const sanitized: Record<string, { slide_name: string; field_data: Record<string, string> }> =
			{};

		for (const [slideKey, slideVal] of Object.entries(slides)) {
			if (isRecord(slideVal)) {
				const slideNameRaw = slideVal["slide_name"];
				const slideName = isString(slideNameRaw) ? slideNameRaw : "";

				const fieldDataRaw = slideVal["field_data"];

				const fieldData: Record<string, string> = isRecord(fieldDataRaw)
					? Object.fromEntries(
							Object.entries(fieldDataRaw).map(([fk, fv]) => [String(fk), isString(fv) ? fv : ""]),
						)
					: {};

				sanitized[String(slideKey)] = {
					slide_name: slideName,
					field_data: fieldData,
				};
			}
		}

		return sanitized;
	}

	return {};
}
