/**
 * Determines the SameSite attribute for cookies based on environment and security.
 *
 * @param params
 * @param params.isProd - Whether the environment is production
 * @param params.redirectOrigin - The redirect origin string
 * @param params.secureFlag - Whether the request is considered secure
 * @returns The SameSite attribute string for the Set-Cookie header
 */
export default function buildSameSiteAttr({
	isProd,
	redirectOrigin,
	secureFlag,
}: Readonly<{
	isProd: boolean;
	redirectOrigin: string;
	secureFlag: boolean;
}>): string {
	// Aggressive dev fix: when running locally with a redirect origin that
	// includes 'localhost' we prefer SameSite=None so the browser will send
	// the session cookie after the OAuth provider redirects back to the
	// app. This is strictly a development convenience and should not be
	// enabled in production.
	if (
		!isProd &&
		(redirectOrigin.includes("localhost") ||
			redirectOrigin.includes("127.0.0.1"))
	) {
		return "SameSite=None;";
	}
	// In secure contexts prefer None to allow cross-site/proxied requests.
	if (secureFlag) {
		return "SameSite=None;";
	}
	// Default to Lax in other non-secure contexts.
	return "SameSite=Lax;";
}
