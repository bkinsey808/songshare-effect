/** noop. use where necessary to get tailwind intellisense */
export function tw(
	strings: TemplateStringsArray,
	...values: ReadonlyArray<string | number>
): string {
	// Combine the strings and values into one final string
	const START_INDEX = 0;
	const INCREMENT = 1;

	let result = strings[START_INDEX] ?? "";

	for (let i = START_INDEX; i < values.length; i += INCREMENT) {
		result += String(values[i]) + (strings[i + INCREMENT] ?? "");
	}

	return result;
}
