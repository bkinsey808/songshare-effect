import { preferredLanguageCookieName } from "@/shared/cookies";
import {
	type SupportedLanguageType,
	defaultLanguage,
	isSupportedLanguage,
} from "@/shared/language/supportedLanguages";

export const setStoredLanguage = (language: SupportedLanguageType): void => {
	if (typeof document !== "undefined") {
		const expires = new Date();
		expires.setDate(expires.getDate() + 365);
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${preferredLanguageCookieName}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
	}
	if (typeof window !== "undefined") {
		localStorage.setItem("preferred-language", language);
	}
};

export const getStoredLanguage = (): SupportedLanguageType | undefined => {
	// First try to get from localStorage (client-side)
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (isSupportedLanguage(stored)) {
			return stored as SupportedLanguageType;
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
};

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
		return isSupportedLanguage(lang)
			? (lang as SupportedLanguageType)
			: undefined;
	}
	return undefined;
};

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
