import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { ImageLibraryEntry } from "../image-library-types";

/**
 * Type guard for a valid `ImageLibraryEntry`.
 *
 * @param value - Unknown value to test.
 * @returns `true` when `value` satisfies the minimum `ImageLibraryEntry` shape.
 */
export default function isImageLibraryEntry(value: unknown): value is ImageLibraryEntry {
	if (!isRecord(value)) {
		return false;
	}
	return isString(value["user_id"]) && isString(value["image_id"]);
}
