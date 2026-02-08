// safeGet not needed here — read from import.meta.env directly
import { getEnvString } from "@/shared/env/getEnv";

/**
 * Gets a Vite environment variable value and ensures it's a string.
 * @param envVar - The environment variable name without the VITE_ prefix
 * @returns The environment variable value as a string, or throws an error if not found
 * @throws Error if the environment variable is not defined or empty
 */
export function getEnvValue(envVar: string): string {
	const fullEnvVar = `VITE_${envVar}`;
	// Use shared runtime helper to read environment-like objects safely.
	// This avoids casting `import.meta.env` to an ad-hoc record at call sites.
	const raw: unknown = getEnvString(import.meta.env, fullEnvVar);

	if (typeof raw !== "string" || raw === "") {
		throw new Error(`Environment variable ${fullEnvVar} is not defined or empty`);
	}

	return raw;
}

/**
 * Gets a Vite environment variable value safely, returning undefined if not found.
 * @param envVar - The environment variable name without the VITE_ prefix
 * @returns The environment variable value as a string, or undefined if not found/empty
 */
export function getEnvValueSafe(envVar: string): string | undefined {
	try {
		return getEnvValue(envVar);
	} catch {
		return undefined;
	}
}
