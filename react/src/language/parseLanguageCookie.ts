import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import { preferredLanguageCookieName } from "@/shared/cookies";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

export default function parseLanguageCookie(
	cookieHeader: string | null,
): SupportedLanguageType | undefined {
	if (cookieHeader === null || cookieHeader === undefined || cookieHeader.trim() === "") {
		return undefined;
	}
	const match = cookieHeader
		.split(";")
		.find((cookie) => cookie.trim().startsWith(`${preferredLanguageCookieName}=`));
	if (typeof match === "string" && match !== "" && match.includes("=")) {
		const [, rawLang] = match.split("=");
		const lang = rawLang?.trim();
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
}
