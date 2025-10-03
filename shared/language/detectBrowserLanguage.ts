import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/language/supportedLanguages";

export function detectBrowserLanguage(
	acceptLanguage?: string,
): SupportedLanguage {
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
		if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
			return lang as SupportedLanguage;
		}
	}
	return "en";
}
