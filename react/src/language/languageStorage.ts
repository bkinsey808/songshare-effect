import { preferredLanguageCookieName } from "@/shared/cookies";
import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/language/supportedLanguages";

export const setStoredLanguage = (language: SupportedLanguage): void => {
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

export const getStoredLanguage = (): SupportedLanguage | undefined => {
	// First try to get from localStorage (client-side)
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (
			stored !== null &&
			stored !== "" &&
			SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)
		) {
			return stored as SupportedLanguage;
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
