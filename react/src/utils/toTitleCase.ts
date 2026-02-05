/**
 * Convert a string to title case (capitalizes the first character of each word).
 *
 * @param str - Input string
 * @returns A string with each word capitalized
 */
export default function toTitleCase(str: string): string {
	const FIRST_CHAR_INDEX = 0;
	const REST_START_INDEX = 1;

	return str.replaceAll(
		/\w\S*/g,
		(text) =>
			text.charAt(FIRST_CHAR_INDEX).toUpperCase() + text.slice(REST_START_INDEX).toLowerCase(),
	);
}
