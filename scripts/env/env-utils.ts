const MIN_LINE_LENGTH = 1;
const KEY_START = 0;
const NEXT_ARG_OFFSET = 1;
const NOT_FOUND = -1;

export type ParsedFlagValues = Readonly<{
	flags: readonly string[];
	values: readonly string[];
}>;

export function getArgValue(args: readonly string[], flag: string, defaultValue: string): string {
	const idx = args.indexOf(flag);
	if (idx === NOT_FOUND) {
		return defaultValue;
	}

	return args[idx + NEXT_ARG_OFFSET] ?? defaultValue;
}

export function collectFlagValues(args: readonly string[], flag: string): string[] {
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

export function parseListLines(text: string, minLineLength = MIN_LINE_LENGTH): string[] {
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length >= minLineLength && !line.startsWith("#"));
}

export function parseKeyValueLines(text: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (trimmed !== "" && !trimmed.startsWith("#")) {
			const eqIdx = trimmed.indexOf("=");
			if (eqIdx !== NOT_FOUND) {
				const key = trimmed.slice(KEY_START, eqIdx).trim();
				const value = trimmed.slice(eqIdx + NEXT_ARG_OFFSET).trim();
				if (key !== "") {
					result[key] = value;
				}
			}
		}
	}
	return result;
}
