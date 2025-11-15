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

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) {
			continue;
		}

		const normalized = line.startsWith("export ")
			? line.slice("export ".length)
			: line;
		const equalsIndex = normalized.indexOf("=");
		if (equalsIndex === -1) {
			continue;
		}

		const key = normalized.slice(0, equalsIndex).trim();
		if (key === "") {
			continue;
		}

		let value = normalized.slice(equalsIndex + 1).trim();
		if (
			(value.startsWith("\"") && value.endsWith("\"")) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!/^[A-Z0-9_]+$/u.test(key)) {
			continue;
		}

		envEntries.set(key, value);
	}

	return Object.fromEntries(envEntries.entries());
}
