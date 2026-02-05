/**
 * Resolve a safe redirect origin using environment config and request info.
 *
 * @param envRedirectOrigin - The environment-provided redirect origin (may be empty)
 * @param opts - Optional request-derived values (requestOrigin and isProd flag)
 * @returns The resolved origin to use for OAuth redirect URIs (no trailing slash)
 */
export default function resolveRedirectOrigin(
	envRedirectOrigin?: string,
	opts?: Readonly<{ requestOrigin?: string; isProd?: boolean }>,
): string {
	const envVal = envRedirectOrigin ?? "";
	const reqVal = opts?.requestOrigin ?? "";
	const isLocalhostEnv = envVal.includes("localhost");
	const isProd = Boolean(opts?.isProd);

	if (isLocalhostEnv && !isProd && reqVal) {
		return reqVal.replace(/\/$/, "");
	}

	if (envVal !== "") {
		return envVal.replace(/\/$/, "");
	}

	return reqVal.replace(/\/$/, "");
}
