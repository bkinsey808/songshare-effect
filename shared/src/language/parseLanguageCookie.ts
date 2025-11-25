import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import { preferredLanguageCookieName } from "../cookies";
import { type SupportedLanguageType } from "./supported-languages";

export const parseLanguageCookie = (
	cookieHeader: string | null,
): SupportedLanguageType | undefined => {
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
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
};
