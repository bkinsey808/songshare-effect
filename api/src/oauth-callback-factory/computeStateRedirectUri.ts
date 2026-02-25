import type { Env } from "@/api/env";

import { apiOauthCallbackPath } from "@/shared/paths";

/**
 * Reconstruct the redirect URI that was originally sent to the OAuth provider.
 *
 * This logic mirrors the inline `computeStateRedirectUri` helper that used to
 * live inside `oauthCallbackFactory`.  Pulling it into its own module keeps the
 * factory shorter and makes the transformation easier to unit test.
 *
 * The rules are:
 *
 * 1. Trim any trailing slash from `origin` and append the configured
 *    `apiOauthCallbackPath` (which may be an empty string).
 * 2. If a `port` string is present and we're not running in production, build
 *    a localhost URL so that the provider callback will match the development
 *    server (the port is stored in the signed state during the initial
 *    OAuth request).
 * 3. If `origin` is falsy (empty string or undefined) fall back to
 *    `apiOauthCallbackPath` alone.
 *
 * @param origin - the `redirect_origin` value stored in the OAuth state
 * @param port - the `redirect_port` value stored in the OAuth state
 * @param env - environment bindings (used for ENVIRONMENT check)
 * @returns the exact redirect URI to supply when exchanging the code
 */
export default function computeStateRedirectUri(
	origin: string | undefined,
	port: unknown,
	env: Env,
): string {
	const trimmed = (origin ?? "").replace(/\/$/, "");
	let computedRedirectUri = trimmed
		? trimmed + (apiOauthCallbackPath ?? "")
		: (apiOauthCallbackPath ?? "");

	if (typeof port === "string" && port !== "" && env.ENVIRONMENT !== "production") {
		computedRedirectUri = `https://localhost:${port}${apiOauthCallbackPath ?? ""}`;
	}

	return computedRedirectUri;
}
