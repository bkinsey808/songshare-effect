import { detectBrowserLanguage } from "@/shared/language/detectBrowserLanguage";
import { parseLanguageCookie } from "@/shared/language/parseLanguageCookie";
import { defaultLanguage } from "@/shared/language/supportedLanguages";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Env = {};

export const onRequest: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);
	const response = await (async () => {
		if (url.pathname === "/") {
			// eslint-disable-next-line sonarjs/no-dead-store
			let detectedLang = defaultLanguage;

			// Check cookie first
			const cookieHeader = context.request.headers.get("Cookie");
			const cookieLang = parseLanguageCookie(cookieHeader);

			// eslint-disable-next-line no-negated-condition
			if (cookieLang !== undefined) {
				detectedLang = cookieLang;
			} else {
				// Fallback to browser language
				const acceptLanguageHeader =
					context.request.headers.get("Accept-Language");
				detectedLang = detectBrowserLanguage(acceptLanguageHeader ?? "");
			}

			// Use 302 (temporary redirect) instead of 301 (permanent) because:
			// 1. Language preference can change based on cookie updates
			// 2. Browser language settings may change over time
			// 3. We don't want search engines to permanently index the redirect
			// 4. This allows the root URL to remain flexible for future language detection logic
			return Response.redirect(`${url.origin}/${detectedLang}/`, 302);
		}

		return context.next();
	})();

	// Add cache control headers for HTML pages
	if (
		url.pathname.endsWith("/") ||
		url.pathname.endsWith(".html") ||
		(!url.pathname.includes(".") && !url.pathname.startsWith("/api/"))
	) {
		// Short cache for HTML to allow quick updates
		response.headers.set(
			"Cache-Control",
			"public, max-age=300, must-revalidate",
		);
		// Help with cache invalidation by adding ETag based on timestamp
		const etag = `"${Math.floor(Date.now() / 300000)}"`;
		response.headers.set("ETag", etag);

		// Check if client has a matching ETag
		const ifNoneMatch = context.request.headers.get("If-None-Match");
		if (ifNoneMatch === etag) {
			return new Response(null, { status: 304 });
		}
	}

	return response;
};
