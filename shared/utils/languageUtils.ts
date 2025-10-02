import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/supportedLanguages";

export const LANGUAGE_COOKIE_NAME = "preferred-language";

export const parseLanguageCookie = (
	cookieHeader: string | null,
): SupportedLanguage | undefined => {
	if (
		cookieHeader === null ||
		cookieHeader === undefined ||
		cookieHeader.trim() === ""
	) {
		return undefined;
	}
	const match = cookieHeader
		.split(";")
		.find((cookie) => cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`));
	if (match !== undefined && match !== null && match.includes("=")) {
		const lang = match.split("=")[1]?.trim();
		return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
			? (lang as SupportedLanguage)
			: undefined;
	}
	return undefined;
};

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
