import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import { preferredLanguageCookieName } from "@/shared/cookies";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Parse the preferred-language cookie value from a Cookie header string.
 *
 * This extracts the cookie named `preferred-language`, trims it, and returns
 * the parsed language only if it is a supported language. Any malformed input
 * (missing header, empty string, or unsupported value) yields `undefined`.
 *
 * @param cookieHeader - The full `Cookie` header value (or `null`/`undefined`).
 * @returns The parsed `SupportedLanguageType` when present and valid; otherwise `undefined`.
 *
 * @example
 * // Cookie header containing the preferred language
 * parseLanguageCookie('foo=1; preferred-language=es; other=2'); // => 'es'
 */
export default function parseLanguageCookie(
	cookieHeader: string | null,
): SupportedLanguageType | undefined {
	if (cookieHeader === null || cookieHeader === undefined || cookieHeader.trim() === "") {
		return undefined;
	}
	const match = cookieHeader
		.split(";")
		.find((cookie) => cookie.trim().startsWith(`${preferredLanguageCookieName}=`));
	if (typeof match === "string" && match !== "" && match.includes("=")) {
		const [, rawLang] = match.split("=");
		const lang = rawLang?.trim();
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
}
