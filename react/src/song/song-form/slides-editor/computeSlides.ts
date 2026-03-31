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
			const backgroundImageId =
				typeof value["background_image_id"] === "string" ? value["background_image_id"] : undefined;
			const backgroundImageUrl =
				typeof value["background_image_url"] === "string"
					? value["background_image_url"]
					: undefined;
			const backgroundImageWidth =
				typeof value["background_image_width"] === "number"
					? value["background_image_width"]
					: undefined;
			const backgroundImageHeight =
				typeof value["background_image_height"] === "number"
					? value["background_image_height"]
					: undefined;
			const backgroundImageFocalPointX =
				typeof value["background_image_focal_point_x"] === "number"
					? value["background_image_focal_point_x"]
					: undefined;
			const backgroundImageFocalPointY =
				typeof value["background_image_focal_point_y"] === "number"
					? value["background_image_focal_point_y"]
					: undefined;
			slidesRecord[key] = {
				slide_name: String(value["slide_name"]),
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
		} else {
			/* empty */
		}
	}
	return slidesRecord;
}
