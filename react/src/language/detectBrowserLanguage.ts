import { type SupportedLanguageType, defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

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
