import type { SupportedLanguageType } from "@/shared/language/supported-languages";

/* oxlint-disable unicorn/no-document-cookie */
import { preferredLanguageCookieName } from "@/shared/cookies";

export default function setStoredLanguage(language: SupportedLanguageType): void {
	if (typeof document !== "undefined") {
		const expires = new Date();
		const DAYS_IN_YEAR = 365;
		expires.setDate(expires.getDate() + DAYS_IN_YEAR);
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${preferredLanguageCookieName}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secure}`;
	}
	if (typeof globalThis !== "undefined") {
		localStorage.setItem("preferred-language", language);
	}
}
