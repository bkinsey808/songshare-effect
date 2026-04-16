import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

/**
 * Type guard that verifies an object is an `ImageTagRow`.
 *
 * @param value - Value to test
 * @returns True when the value conforms to `ImageTagRow`
 */
export default function isImageTagRow(value: unknown): value is ImageTagRow {
	return isRecord(value) && isString(value["image_id"]);
}
