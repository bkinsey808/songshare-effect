import {
	type SupportedLanguageType,
	defaultLanguage,
	isSupportedLanguage,
} from "@/shared/language/supportedLanguages";

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
			const parts = lang.split(";");
			const langPart = parts[0];
			if (langPart === undefined || langPart === null || langPart === "") {
				return "";
			}
			const mainLang = langPart.split("-")[0];
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
