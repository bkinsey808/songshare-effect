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
	CACHE_MAX_AGE_HTML_SEC,
	ETAG_INTERVAL_MS,
	HTTP_INTERNAL,
	HTTP_NOT_MODIFIED,
	HTTP_REDIRECT_LOWER,
	HTTP_REDIRECT_UPPER,
	HTTP_TEMP_REDIRECT,
} from "@/shared/constants/http";
import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";
import parseLanguageCookie from "@/shared/language/parseLanguageCookie";
import { defaultLanguage } from "@/shared/language/supported-languages";

type Env = Record<string, unknown>;

// Minimal typed signature for Pages Functions middleware context.
// The Cloudflare Pages Functions runtime provides a `context` object with
// a `request` (standard Fetch API Request) and a `next` helper which
// yields a Response for the next middleware/handler.
// We keep the type intentionally small so code using only these properties
// is properly typed without requiring external ambient types.
type PagesMiddlewareContext = {
	request: Request;
	next: () => Promise<Response>;
	env?: Env;
	// `waitUntil` is sometimes provided in edge runtimes; mark optional
	waitUntil?: (promise: Promise<unknown>) => void;
};

export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
	try {
		const url = new URL(context.request.url);
		// normal execution continues
		if (url.pathname === "/") {
			let detectedLang = defaultLanguage;

			// Check cookie first
			const cookieHeader = context.request.headers.get("Cookie");
			const cookieLang = parseLanguageCookie(cookieHeader);

			if (cookieLang === undefined) {
				// No cookie preference — fall back to browser Accept-Language detection
				const acceptLanguageHeader = context.request.headers.get("Accept-Language");
				// pass a safe string | undefined into the detector to avoid `any` flows
				detectedLang = detectBrowserLanguage(acceptLanguageHeader ?? undefined);
			} else {
				// Honor explicit cookie preference when present
				detectedLang = cookieLang;
			}

			// Use 302 (temporary redirect) instead of 301 (permanent) because:
			// 1. Language preference can change based on cookie updates
			// 2. Browser language settings may change over time
			// 3. We don't want search engines to permanently index the redirect
			// 4. This allows the root URL to remain flexible for future language detection logic
			// redirect; return early without extra logs
			return Response.redirect(`${url.origin}/${detectedLang}/`, HTTP_TEMP_REDIRECT);
		}

		const response = await context.next();

		// Add cache control headers for HTML pages.
		// Skip adding headers for redirects (3xx) so we don't attempt to mutate
		// redirect Responses which may be immutable in the runtime and cause
		// exceptions (this previously caused 500s for the root redirect).
		if (
			((url.pathname.endsWith("/") ||
				url.pathname.endsWith(".html") ||
				(!url.pathname.includes(".") && !url.pathname.startsWith("/api/"))) &&
				typeof response.status === "number" &&
				response.status < HTTP_REDIRECT_LOWER) ||
			response.status >= HTTP_REDIRECT_UPPER
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
				return new Response(undefined, { status: HTTP_NOT_MODIFIED });
			}
		}

		return response;
	} catch (error) {
		try {
			console.error(
				"[pages/_middleware] Unhandled error:",
				error instanceof Error ? (error.stack ?? error.message) : String(error),
			);
		} catch (error) {
			// Ensure we don't throw while logging
			console.error("[pages/_middleware] Failed to log error:", String(error));
		}

		return new Response("Internal Server Error", { status: HTTP_INTERNAL });
	}
}

// Keep exports at the end of the file (style rule)
export type { Env };
