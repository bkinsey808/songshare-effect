import { preferredLanguageCookieName } from "../cookies";
import {
	type SupportedLanguageType,
	isSupportedLanguage,
} from "./supportedLanguages";

export const parseLanguageCookie = (
	cookieHeader: string | null,
): SupportedLanguageType | undefined => {
	if (
		cookieHeader === null ||
		// eslint-disable-next-line sonarjs/different-types-comparison
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
	// eslint-disable-next-line sonarjs/different-types-comparison
	if (match !== undefined && match !== null && match.includes("=")) {
		const lang = match.split("=")[1]?.trim();
		return isSupportedLanguage(lang)
			? (lang as SupportedLanguageType)
			: undefined;
	}
	return undefined;
};
