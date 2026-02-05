import { type SupportedLanguageType, defaultLanguage } from "./supported-languages";
import { isSupportedLanguage } from "./supported-languages-effect";

/**
 * Parse an Accept-Language header (or similar) and return the best supported
 * two-letter language code. Returns the configured `defaultLanguage` when no
 * supported language is found.
 *
 * @param acceptLanguage - The raw `Accept-Language` header value
 * @returns The detected `SupportedLanguageType` or `defaultLanguage` when none match
 */
export default function detectBrowserLanguage(acceptLanguage?: string): SupportedLanguageType {
	if (acceptLanguage === undefined || acceptLanguage === null || acceptLanguage.trim() === "") {
		return defaultLanguage;
	}
	const languages = acceptLanguage
		.split(",")
		.map((lang) => {
			const [langPart] = lang.split(";");
			if (langPart === undefined || langPart === null || langPart === "") {
				return "";
			}
			const [mainLang] = langPart.split("-");
			if (mainLang === undefined || mainLang === null || mainLang === "") {
				return "";
			}
			return mainLang.trim().toLowerCase();
		})
		.filter((lang) => lang !== "");

	for (const lang of languages) {
		if (isSupportedLanguage(lang)) {
			return lang;
		}
	}
	return defaultLanguage;
}
