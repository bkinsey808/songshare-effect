import { safeGet } from "@/shared/utils/safe";

/**
 * Gets a Vite environment variable value and ensures it's a string.
 * @param envVar - The environment variable name without the VITE_ prefix
 * @returns The environment variable value as a string, or throws an error if not found
 * @throws Error if the environment variable is not defined or empty
 */
export function getEnvValue(envVar: string): string {
	const fullEnvVar = `VITE_${envVar}`;
	const value = safeGet(import.meta.env, fullEnvVar) as string | undefined;

	if (typeof value !== "string" || value === "") {
		throw new Error(
			`Environment variable ${fullEnvVar} is not defined or empty`,
		);
	}

	return value;
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
