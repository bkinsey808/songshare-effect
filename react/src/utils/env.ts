// safeGet not needed here — read from import.meta.env directly

/**
 * Gets a Vite environment variable value and ensures it's a string.
 * @param envVar - The environment variable name without the VITE_ prefix
 * @returns The environment variable value as a string, or throws an error if not found
 * @throws Error if the environment variable is not defined or empty
 */
export function getEnvValue(envVar: string): string {
	const fullEnvVar = `VITE_${envVar}`;
	// Read the env value as unknown and validate at runtime to avoid unsafe assertions
	// Cast is unavoidable because `import.meta.env` has a specialized type.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
	const raw: unknown = (import.meta.env as unknown as Record<string, unknown>)[
		fullEnvVar
	];

	if (typeof raw !== "string" || raw === "") {
		throw new Error(
			`Environment variable ${fullEnvVar} is not defined or empty`,
		);
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
