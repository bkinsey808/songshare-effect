const KEY_START = 0;
const NEXT_ARG_OFFSET = 1;

/**
 * Collects all values that follow a repeated flag in an argument list.
 *
 * For example, `["--config", "a", "--config", "b"]` with flag `"--config"`
 * returns `["a", "b"]`.
 *
 * @param args - The argument list to scan.
 * @param flag - The flag name to match (e.g. `"--config"`).
 * @returns All values that immediately follow the given flag.
 */
export default function collectFlagValues(args: readonly string[], flag: string): string[] {
	const values: string[] = [];
	for (let i = KEY_START; i < args.length; i++) {
		if (args[i] === flag && i + NEXT_ARG_OFFSET < args.length) {
			const value = args[i + NEXT_ARG_OFFSET];
			if (value !== undefined) {
				values.push(value);
			}
		}
	}
	return values;
}
