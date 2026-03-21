import type { ImageTagRow } from "@/react/tag-library/image/ImageTagRow.type";
import isRecord from "@/shared/type-guards/isRecord";
import isString from "@/shared/type-guards/isString";

export default function isImageTagRow(value: unknown): value is ImageTagRow {
	return isRecord(value) && isString(value["image_id"]);
}
