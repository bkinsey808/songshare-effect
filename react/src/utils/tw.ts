/** noop. use where necessary to get tailwind intellisense */
export const tw = (
	strings: TemplateStringsArray,
	...values: (string | number)[]
): string => {
	// Combine the strings and values into one final string
	return strings.reduce(
		(result, str, i) => result + (values[i - 1] ?? "") + str,
	);
};
