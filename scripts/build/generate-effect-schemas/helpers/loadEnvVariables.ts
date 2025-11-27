import { readFileSync } from "fs";

/**
 * Loads environment variables from an .env file into a plain object.
 * Supports lines prefixed with `export` and skips comments or invalid keys.
 *
 * @param envFilePath - Absolute path to the environment file to parse.
 * @returns Key-value pairs representing the parsed environment variables.
 */
export function loadEnvVariables(envFilePath: string): Record<string, string> {
	const envEntries = new Map<string, string>();
	const content = readFileSync(envFilePath, "utf8");
	const lines = content.split(/\r?\n/);

	const NO_INDEX = -1;
	const EXPORT_PREFIX = "export ";
	const EMPTY = "";
	const SLICE_OFFSET = 1;

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (line === EMPTY || line.startsWith("#")) {
			// skip empty lines or comments
		} else {
			const normalized = line.startsWith(EXPORT_PREFIX)
				? line.slice(EXPORT_PREFIX.length)
				: line;

			const equalsIndex = normalized.indexOf("=");
			if (equalsIndex === NO_INDEX) {
				// malformed line (no equals sign) — skip
			} else {
				const START_INDEX = 0;
				const key = normalized.slice(START_INDEX, equalsIndex).trim();

				if (key === EMPTY) {
					// invalid key — skip
				} else {
					let value = normalized.slice(equalsIndex + SLICE_OFFSET).trim();
					if (
						(value.startsWith('"') && value.endsWith('"')) ||
						(value.startsWith("'") && value.endsWith("'"))
					) {
						value = value.slice(SLICE_OFFSET, value.length - SLICE_OFFSET);
					}

					if (!/^[A-Z0-9_]+$/u.test(key)) {
						// invalid key characters — skip
					} else {
						envEntries.set(key, value);
					}
				}
			}
		}
	}

	return Object.fromEntries(envEntries.entries());
}
