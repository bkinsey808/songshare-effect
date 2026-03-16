import { clientWarn } from "@/react/lib/utils/clientLogger";

import type { ImageLibraryEntry } from "../image-library-types";
import isImageLibraryEntry from "./isImageLibraryEntry";

/**
 * Guard that validates and narrows a value as an `ImageLibraryEntry`.
 *
 * @param value - The value to validate.
 * @param context - Optional context string for error messages.
 * @returns - The validated `ImageLibraryEntry`.
 * @throws - `TypeError` when the value is not a valid entry.
 */
export default function guardAsImageLibraryEntry(
	value: unknown,
	context = "ImageLibraryEntry",
): ImageLibraryEntry {
	if (!isImageLibraryEntry(value)) {
		clientWarn(`[guardAsImageLibraryEntry] Invalid ${context}:`, value);
		throw new TypeError(`Expected valid ImageLibraryEntry in ${context}`);
	}
	return value;
}
