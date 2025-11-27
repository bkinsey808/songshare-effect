import { preferredLanguageCookieName } from "@/shared/cookies";
import {
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

export function setStoredLanguage(language: SupportedLanguageType): void {
	if (typeof document !== "undefined") {
		const expires = new Date();
		const DAYS_IN_YEAR = 365;
		expires.setDate(expires.getDate() + DAYS_IN_YEAR);
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${preferredLanguageCookieName}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
	}
	if (typeof window !== "undefined") {
		localStorage.setItem("preferred-language", language);
	}
}

export function getStoredLanguage(): SupportedLanguageType | undefined {
	// First try to get from localStorage (client-side)
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (isSupportedLanguage(stored)) {
			return stored;
		}
	}

	// Then try to get from cookies (works on both client and server)
	if (typeof document !== "undefined") {
		const cookieValue = parseLanguageCookie(document.cookie);
		if (cookieValue !== undefined) {
			return cookieValue;
		}
	}

	return undefined;
}

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
	if (typeof match === "string" && match !== "" && match.includes("=")) {
		const [, rawLang] = match.split("=");
		const lang = rawLang?.trim();
		return isSupportedLanguage(lang) ? lang : undefined;
	}
	return undefined;
}

export function detectBrowserLanguage(
	acceptLanguage?: string,
): SupportedLanguageType {
	if (
		acceptLanguage === undefined ||
		acceptLanguage === null ||
		acceptLanguage.trim() === ""
	) {
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
