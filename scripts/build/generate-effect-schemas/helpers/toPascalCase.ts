/**
 * Converts a snake_case table or field name into PascalCase.
 *
 * @param str - Underscore-delimited identifier to convert.
 * @returns PascalCase version of the provided identifier.
 */
export default function toPascalCase(str: string): string {
	const FIRST_INDEX = 0;
	const REST_START = 1;
	return str
		.split("_")
		.map((word) => word.charAt(FIRST_INDEX).toUpperCase() + word.slice(REST_START))
		.join("");
}
