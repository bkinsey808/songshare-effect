/**
 * Resolves the Cloudflare Worker service name.
 *
 * If no explicit service name is provided, defaults to `songshare-<env>`.
 *
 * @param envArg - The deployment environment (e.g. `"staging"`, `"production"`).
 * @param serviceArg - An optional explicit service name override.
 * @returns The resolved service name.
 */
export default function resolveServiceName(envArg: string, serviceArg: string | undefined): string {
	return serviceArg === undefined || serviceArg === "" ? `songshare-${envArg}` : serviceArg;
}
