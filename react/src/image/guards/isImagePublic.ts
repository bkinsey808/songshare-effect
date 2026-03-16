import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

import type { ImagePublic } from "../image-types";

/**
 * Type guard that checks if a value has the shape of an `ImagePublic`.
 *
 * @param value - Unknown value to test.
 * @returns `true` when `value` satisfies the `ImagePublic` shape.
 */
export default function isImagePublic(value: unknown): value is ImagePublic {
	if (!isRecord(value)) {
		return false;
	}
	return isString(value["image_id"]) && isString(value["user_id"]);
}
