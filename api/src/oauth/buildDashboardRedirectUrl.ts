import type { Context } from "hono";

/**
 * Computes the dashboard redirect URL after OAuth sign-in, including support for custom redirect ports.
 *
 * @param ctx - Hono context (for env and request info)
 * @param url - The current request URL (as a URL object)
 * @param redirectPort - Optional port string from OAuth state
 * @param lang - Language code for the dashboard path
 * @param dashboardPath - The dashboard path (e.g. 'dashboard')
 * @returns The computed dashboard redirect URL
 */
export function buildDashboardRedirectUrl(
	ctx: Context,
	url: URL,
	redirectPort: string | undefined,
	lang: string,
	dashboardPath: string,
): string {
	let dashboardRedirectUrl = `/${lang}/${dashboardPath}`;
	if (redirectPort !== undefined && redirectPort !== "") {
		// Only allow redirect to a port if it matches the allowed origins
		const allowedOrigins = ((ctx.env.ALLOWED_REDIRECT_ORIGINS ?? "") as string)
			.split(",")
			.map((origin) => String(origin).trim())
			.filter((origin) => origin.length > 0);
		const proto = url.protocol.replace(":", "");
		const host = url.hostname;
		const candidate = `${proto}://${host}:${redirectPort}/${lang}/${dashboardPath}`;
		if (allowedOrigins.some((origin: string) => candidate.startsWith(origin))) {
			dashboardRedirectUrl = candidate;
		}
	}
	// Always append justSignedIn=1 marker for SPA detection
	const hasQuery = dashboardRedirectUrl.includes("?");
	dashboardRedirectUrl = `${dashboardRedirectUrl}${hasQuery ? "&" : "?"}justSignedIn=1`;
	return dashboardRedirectUrl;
}
