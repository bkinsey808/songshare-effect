import type { SupportedLanguage } from "@/shared/supportedLanguages";
import {
	detectBrowserLanguage,
	parseLanguageCookie,
} from "@/shared/utils/languageUtils";

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

		return Response.redirect(`${url.origin}/${detectedLang}/`, 302);
	}

	return context.next();
};
