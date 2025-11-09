/** noop. use where necessary to get tailwind intellisense */
export const tw = (
	strings: TemplateStringsArray,
	...values: ReadonlyArray<string | number>
): string => {
	// Combine the strings and values into one final string
	return strings.reduce(
		({ result, i }: Readonly<{ result: string; i: number }>, str: string) => ({
			result: result + (values[i - 1] ?? "") + str,
			i: i + 1,
		}),
		{ result: "", i: 0 },
	).result;
};
