import { preferredLanguageCookieName } from "../cookies";
import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "./supportedLanguages";

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
		.find((cookie) =>
			cookie.trim().startsWith(`${preferredLanguageCookieName}=`),
		);
	if (match !== undefined && match !== null && match.includes("=")) {
		const lang = match.split("=")[1]?.trim();
		return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
			? (lang as SupportedLanguage)
			: undefined;
	}
	return undefined;
};
