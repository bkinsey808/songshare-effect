import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import parseLanguageCookie from "./parseLanguageCookie";

export default function getStoredLanguage(): SupportedLanguageType | undefined {
	// First try to get from localStorage (client-side)
	if (typeof globalThis !== "undefined") {
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
