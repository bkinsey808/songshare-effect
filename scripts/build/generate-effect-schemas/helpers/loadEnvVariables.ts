import { readFileSync } from "node:fs";
import computeEnvValue from "./computeEnvValue";


/**
 * Loads environment variables from an .env file into a plain object.
 * Supports lines prefixed with `export` and skips comments or invalid keys.
 *
 * @param envFilePath - Absolute path to the environment file to parse.
 * @returns Key-value pairs representing the parsed environment variables.
 */
export default function loadEnvVariables(envFilePath: string): Record<string, string> {
	const envEntries = new Map<string, string>();
	const content = readFileSync(envFilePath, "utf8");
	const lines = content.split(/\r?\n/);

	const NO_INDEX = -1;
	const EXPORT_PREFIX = "export ";
	const EMPTY = "";


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

				if (key === EMPTY || !/^[A-Z0-9_]+$/u.test(key)) {
					// invalid or malformed key — skip
				} else {
					const value = computeEnvValue(normalized, equalsIndex);
					envEntries.set(key, value);
				}
			}
		}
	}

	return Object.fromEntries(envEntries.entries());
}
