/**
 * Cloudflare Pages Functions Middleware
 *
 * The underscore prefix (_middleware.ts) is a Cloudflare Pages convention for special files:
 * - Files starting with _ are configuration/system files, not regular content
 * - _middleware.ts runs as edge middleware before serving static content
 * - _headers defines HTTP caching rules globally
 * - _redirects would define URL redirects (if present)
 *
 * This middleware runs at Cloudflare's edge locations (200+ globally) and handles:
 * - Language detection and routing optimization
 * - HTML page caching with ETag validation
 * - HTTP 304 responses for unchanged content
 */
import {
	HTTP_TEMP_REDIRECT,
	HTTP_INTERNAL,
	HTTP_NOT_MODIFIED,
	CACHE_MAX_AGE_HTML_SEC,
	ETAG_INTERVAL_MS,
	HTTP_REDIRECT_LOWER,
	HTTP_REDIRECT_UPPER,
} from "@/shared/constants/http";
import { detectBrowserLanguage } from "@/shared/language/detectBrowserLanguage";
import { parseLanguageCookie } from "@/shared/language/parseLanguageCookie";
import { defaultLanguage } from "@/shared/language/supported-languages";

export type Env = {};

export async function onRequest(
	context: Parameters<PagesFunction<Env>>[number],
): Promise<Response> {
	try {
		const url = new URL(context.request.url);
		// normal execution continues
		const response = await (async () => {
			if (url.pathname === "/") {
				let detectedLang = defaultLanguage;

				// Check cookie first
				const cookieHeader = context.request.headers.get("Cookie");
				// no-op logging removed for production
				const cookieLang = parseLanguageCookie(cookieHeader);

				if (cookieLang !== undefined) {
					detectedLang = cookieLang;
				} else {
					// Fallback to browser language
					const acceptLanguageHeader = context.request.headers.get("Accept-Language");
					detectedLang = detectBrowserLanguage(acceptLanguageHeader ?? "");
				}

				// Use 302 (temporary redirect) instead of 301 (permanent) because:
				// 1. Language preference can change based on cookie updates
				// 2. Browser language settings may change over time
				// 3. We don't want search engines to permanently index the redirect
				// 4. This allows the root URL to remain flexible for future language detection logic
				// redirect; return early without extra logs
				return Response.redirect(`${url.origin}/${detectedLang}/`, HTTP_TEMP_REDIRECT);
			}

			return context.next();
		})();

		// Add cache control headers for HTML pages.
		// Skip adding headers for redirects (3xx) so we don't attempt to mutate
		// redirect Responses which may be immutable in the runtime and cause
		// exceptions (this previously caused 500s for the root redirect).
		if (
			(url.pathname.endsWith("/") ||
				url.pathname.endsWith(".html") ||
				(!url.pathname.includes(".") && !url.pathname.startsWith("/api/"))) &&
			typeof response.status === "number" &&
			!(response.status >= HTTP_REDIRECT_LOWER && response.status < HTTP_REDIRECT_UPPER)
		) {
			// Short cache for HTML to allow quick updates
			response.headers.set(
				"Cache-Control",
				`public, max-age=${CACHE_MAX_AGE_HTML_SEC}, must-revalidate`,
			);
			// Help with cache invalidation by adding ETag based on timestamp
			const etag = `"${Math.floor(Date.now() / ETAG_INTERVAL_MS)}"`;
			response.headers.set("ETag", etag);

			// Check if client has a matching ETag
			const ifNoneMatch = context.request.headers.get("If-None-Match");
			if (ifNoneMatch === etag) {
				return new Response(null, { status: HTTP_NOT_MODIFIED });
			}
		}

		return response;
	} catch (err) {
		try {
			console.error(
				"[pages/_middleware] Unhandled error:",
				err instanceof Error ? (err.stack ?? err.message) : String(err),
			);
		} catch (logErr) {
			// Ensure we don't throw while logging
			console.error("[pages/_middleware] Failed to log error:", String(logErr));
		}

		return new Response("Internal Server Error", { status: HTTP_INTERNAL });
	}
}
