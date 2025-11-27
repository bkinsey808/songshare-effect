export function toTitleCase(str: string): string {
	const FIRST_CHAR_INDEX = 0;
	const REST_START_INDEX = 1;

	return str.replace(
		/\w\S*/g,
		(text) =>
			text.charAt(FIRST_CHAR_INDEX).toUpperCase() +
			text.substring(REST_START_INDEX).toLowerCase(),
	);
}
