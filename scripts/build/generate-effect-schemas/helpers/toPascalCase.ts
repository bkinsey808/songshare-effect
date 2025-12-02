export default function toPascalCase(str: string): string {
	const FIRST_INDEX = 0;
	const REST_START = 1;
	return str
		.split("_")
		.map(
			(word) => word.charAt(FIRST_INDEX).toUpperCase() + word.slice(REST_START),
		)
		.join("");
}
