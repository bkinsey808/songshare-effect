import { detectBrowserLanguage } from "@/shared/language/detectBrowserLanguage";
import { parseLanguageCookie } from "@/shared/language/parseLanguageCookie";
import {
	type SupportedLanguageType,
	defaultLanguage,
	isSupportedLanguage,
} from "@/shared/language/supportedLanguages";

// Detect initial language with priority order
export const detectInitialLanguage = (): SupportedLanguageType => {
	// 1. Check URL parameter (highest priority for explicit navigation)
	const path = window.location.pathname;
	const langMatch = path.match(/^\/([a-z]{2})\//);
	if (langMatch !== null && langMatch[1] !== undefined && langMatch[1] !== "") {
		const urlLang = langMatch[1];
		if (isSupportedLanguage(urlLang)) {
			return urlLang as SupportedLanguageType;
		}
	}

	// 2. Check stored preference in localStorage
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (stored !== null && stored !== "") {
			if (isSupportedLanguage(stored)) {
				return stored as SupportedLanguageType;
			}
		}
	}

	// 3. Check stored preference in cookies
	if (typeof document !== "undefined") {
		const cookieValue = parseLanguageCookie(document.cookie);
		if (cookieValue !== undefined) {
			return cookieValue;
		}
	}

	// 4. Detect from browser language
	if (typeof navigator !== "undefined") {
		return detectBrowserLanguage(navigator.language);
	}

	// 5. Default fallback
	return defaultLanguage;
};
