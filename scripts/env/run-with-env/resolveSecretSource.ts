type ResolveSecretSourceOptions = Readonly<{
	currentValue: string | undefined;
	isCI: boolean;
	keyringAvailable: boolean;
	secretName: string;
}>;

/**
 * Chooses how `run-with-env.bun.ts` should resolve a requested secret value.
 *
 * Existing environment variables win so CI can inject secrets without relying
 * on a machine-local keyring. When no environment value exists, local runs
 * still require the `keyring` executable, while CI can continue and let the
 * downstream command surface any truly missing variables.
 *
 * @param options - Current secret state and execution environment flags.
 * @returns The source that should provide the secret value.
 * @throws Error if a non-CI run needs keyring access but `keyring` is unavailable.
 */
export default function resolveSecretSource(options: ResolveSecretSourceOptions): SecretSource {
	const { currentValue, isCI, keyringAvailable, secretName } = options;

	if (currentValue !== undefined && currentValue !== "") {
		return "env";
	}

	if (keyringAvailable) {
		return "keyring";
	}

	if (isCI) {
		return "skip";
	}

	throw new Error(
		`The "keyring" executable is required to load ${secretName}. Install keyring locally, or inject ${secretName} via the environment when running in CI.`,
	);
}

export type SecretSource = "env" | "keyring" | "skip";
