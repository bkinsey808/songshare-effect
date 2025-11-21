import { existsSync, readFileSync } from "fs";

/**
 * Load environment variables from a `.env` file in the current working directory.
 *
 * - Ignores blank lines and lines starting with `#`.
 * - Splits each line on the first `=` and trims whitespace.
 *
 * @returns An object mapping environment variable names to their values.
 */
export function loadEnvVars(): Record<string, string | undefined> {
	const env: Record<string, string | undefined> = {};

	try {
		const envFile = ".env";
		if (existsSync(envFile)) {
			const content = readFileSync(envFile, "utf-8");
			content.split("\n").forEach((line: string) => {
				const trimmed = line.trim();
				if (trimmed !== "" && !trimmed.startsWith("#")) {
					const [key, ...valueParts] = trimmed.split("=");
					const keyStr = key ?? "";
					if (keyStr !== "" && valueParts.length > 0) {
						env[keyStr.trim()] = valueParts.join("=").trim();
					}
				}
			});
		}
	} catch (error) {
		console.error("❌ Error loading .env file:", error);
		process.exit(1);
	}

	return env;
}
