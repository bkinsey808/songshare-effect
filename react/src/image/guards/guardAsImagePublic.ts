import type { ImagePublic } from "../image-types";
import isImagePublic from "./isImagePublic";

/**
 * Asserts that a value is an `ImagePublic`, throwing if it isn't.
 *
 * @param value - Unknown value to check.
 * @param context - Contextual label for the error message.
 * @returns The value cast to `ImagePublic`.
 */
export default function guardAsImagePublic(value: unknown, context: string): ImagePublic {
	if (!isImagePublic(value)) {
		throw new TypeError(`[guardAsImagePublic] Invalid ImagePublic (${context})`);
	}
	return value;
}
