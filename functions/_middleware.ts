import { detectBrowserLanguage } from "@/shared/language/detectBrowserLanguage";
import { parseLanguageCookie } from "@/shared/language/parseLanguageCookie";
import type { SupportedLanguage } from "@/shared/language/supportedLanguages";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Env = {};

export const onRequest: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);

	if (url.pathname === "/") {
		let detectedLang: SupportedLanguage = "en";

		// Check cookie first
		const cookieHeader = context.request.headers.get("Cookie");
		const cookieLang = parseLanguageCookie(cookieHeader);

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
};
