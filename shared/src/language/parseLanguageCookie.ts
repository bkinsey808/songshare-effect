import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import { preferredLanguageCookieName } from "../cookies";
import { type SupportedLanguageType } from "./supported-languages";

export function parseLanguageCookie(
	cookieHeader: string | null,
): SupportedLanguageType | undefined {
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
		const [, raw] = match.split("=");
		const lang = raw?.trim();
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
}
