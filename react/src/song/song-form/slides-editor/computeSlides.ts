import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { Slide } from "../song-form-types";

function buildFieldData(fieldDataRaw: unknown): Record<string, string> {
	const out: Record<string, string> = {};
	if (!isRecord(fieldDataRaw)) {
		return out;
	}
	for (const [fieldKey, fieldValue] of Object.entries(fieldDataRaw)) {
		if (typeof fieldValue === "string") {
			out[fieldKey] = fieldValue;
		}
	}
	return out;
}

/**
 * Convert the optional public payload's `slides` entry into validated `Slide` objects.
 *
 * @param pub - Optional public payload that may contain a `slides` map
 * @returns Record mapping slide ids to `Slide` objects
 */
export default function computeSlides(pub?: Record<string, unknown>): Record<string, Slide> {
	if (!pub || !isRecord(pub["slides"])) {
		return {};
	}
	const slidesRecord: Record<string, Slide> = {};
	for (const [key, value] of Object.entries(pub["slides"])) {
		if (isRecord(value) && isString(value["slide_name"])) {
			const fieldData = buildFieldData(value["field_data"]);
			slidesRecord[key] = {
				slide_name: String(value["slide_name"]),
				field_data: fieldData,
			};
		} else {
			/* empty */
		}
	}
	return slidesRecord;
}
