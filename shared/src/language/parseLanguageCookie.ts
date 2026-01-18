import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import { preferredLanguageCookieName } from "../cookies";
import { type SupportedLanguageType } from "./supported-languages";

/**
 * Parse the preferred-language cookie value from a Cookie header string.
 *
 * Extracts the cookie named `preferred-language`, normalizes whitespace, and
 * returns the language only when it is recognised by the application. Returns
 * `undefined` for missing, empty, malformed, or unsupported values.
 *
 * @param cookieHeader - The raw `Cookie` header (may be `null`).
 * @returns The `SupportedLanguageType` if valid; otherwise `undefined`.
 *
 * @example
 * parseLanguageCookie('preferred-language=zh; a=b'); // => 'zh'
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
	if (match !== undefined && match !== null && match.includes("=")) {
		const [, raw] = match.split("=");
		const lang = raw?.trim();
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
}
