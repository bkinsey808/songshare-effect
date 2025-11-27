import { detectBrowserLanguage } from "@/shared/language/detectBrowserLanguage";
import { parseLanguageCookie } from "@/shared/language/parseLanguageCookie";
import {
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

// Detect initial language with priority order
export function detectInitialLanguage(): SupportedLanguageType {
	// 1. Check URL parameter (highest priority for explicit navigation)
	const path = window.location.pathname;
	const LANG_CODE_LENGTH = 2; // two-letter language codes (e.g. en, fr)
	const langRegExp = new RegExp(`^\\/([a-z]{${LANG_CODE_LENGTH}})\\/`);
	const langMatch = langRegExp.exec(path);
	if (langMatch !== null) {
		const [, urlLang] = langMatch;
		if (urlLang !== undefined && urlLang !== "") {
			if (isSupportedLanguage(urlLang)) {
				return urlLang;
			}
		}
	}

	// 2. Check stored preference in localStorage
	if (typeof window !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (stored !== null && stored !== "") {
			if (isSupportedLanguage(stored)) {
				return stored;
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
}
