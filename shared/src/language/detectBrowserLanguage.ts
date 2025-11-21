import {
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

export function detectBrowserLanguage(
	acceptLanguage?: string,
): SupportedLanguageType {
	if (
		acceptLanguage === undefined ||
		// eslint-disable-next-line sonarjs/different-types-comparison
		acceptLanguage === null ||
		acceptLanguage.trim() === ""
	) {
		return "en";
	}
	const languages = acceptLanguage
		.split(",")
		.map((lang) => {
			const parts = lang.split(";");
			const langPart = parts[0];
			// eslint-disable-next-line sonarjs/different-types-comparison
			if (langPart === undefined || langPart === null || langPart === "") {
				return "";
			}
			const mainLang = langPart.split("-")[0];
			// eslint-disable-next-line sonarjs/different-types-comparison
			return mainLang !== undefined && mainLang !== null && mainLang !== ""
				? mainLang.trim().toLowerCase()
				: "";
		})
		.filter((lang) => lang !== "");

	for (const lang of languages) {
		if (isSupportedLanguage(lang)) {
			return lang as SupportedLanguageType;
		}
	}
	return defaultLanguage;
}
