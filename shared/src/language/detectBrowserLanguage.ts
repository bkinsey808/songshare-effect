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
		acceptLanguage === null ||
		acceptLanguage.trim() === ""
	) {
		return "en";
	}
	const languages = acceptLanguage
		.split(",")
		.map((lang) => {
			const [langPart = ""] = lang.split(";");
			if (!langPart) {
				return "";
			}
			const [mainLang = ""] = langPart.split("-");
			return mainLang ? mainLang.trim().toLowerCase() : "";
		})
		.filter((lang) => lang !== "");

	for (const lang of languages) {
		if (isSupportedLanguage(lang)) {
			return lang;
		}
	}
	return defaultLanguage;
}
