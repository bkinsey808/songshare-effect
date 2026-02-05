import { existsSync, readFileSync } from "node:fs";

import { ZERO } from "@/shared/constants/shared-constants";

import { error as sError } from "../../utils/scriptLogger";

/**
 * Load environment variables from a `.env` file in the current working directory.
 *
 * - Ignores blank lines and lines starting with `#`.
 * - Splits each line on the first `=` and trims whitespace.
 *
 * @returns An object mapping environment variable names to their values.
 */
export default function loadEnvVars(): Record<string, string | undefined> {
	const env: Record<string, string | undefined> = {};

	try {
		const envFile = ".env";
		if (!existsSync(envFile)) {
			return env;
		}

		const content = readFileSync(envFile, "utf8");
		const lines = content.split("\n");
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed === "" || trimmed.startsWith("#")) {
				// skip blank lines and comment lines
			} else {
				const [key, ...valueParts] = trimmed.split("=");
				const keyStr = key ?? "";
				if (keyStr !== "" && valueParts.length > ZERO) {
					env[keyStr.trim()] = valueParts.join("=").trim();
				}
			}
		}
	} catch (error) {
		sError("❌ Error loading .env file:", error);
		if (error instanceof Error) {
			throw error;
		}
		// Preserve the original error as the cause to retain original context.
		throw new Error("Non-Error thrown while loading .env", { cause: error });
	}

	return env;
}
