import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";
import parseLanguageCookie from "@/shared/language/parseLanguageCookie";
import { type SupportedLanguageType, defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Detects the initial language for the app using a priority order:
 * 1) URL path language segment
 * 2) Local storage preference
 * 3) Language cookie
 * 4) Browser language detection
 * 5) Default fallback
 *
 * @returns The determined supported language to use on initial load
 */
export default function detectInitialLanguage(): SupportedLanguageType {
	// 1. Check URL parameter (highest priority for explicit navigation)
	const path = globalThis.location.pathname;
	const LANG_CODE_LENGTH = 2; // two-letter language codes (e.g. en, fr)
	const langRegExp = new RegExp(`^\\/([a-z]{${LANG_CODE_LENGTH}})\\/`);
	const langMatch = langRegExp.exec(path);
	if (langMatch !== null) {
		const [, urlLang] = langMatch;
		if (urlLang !== undefined && urlLang !== "" && isSupportedLanguage(urlLang)) {
			return urlLang;
		}
	}

	// 2. Check stored preference in localStorage
	if (typeof globalThis !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (stored !== null && stored !== "" && isSupportedLanguage(stored)) {
			return stored;
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
		const lang = detectBrowserLanguage(String(navigator.language));
		return lang;
	}

	// 5. Default fallback
	return defaultLanguage;
}
