import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import detectBrowserLanguage from "./detectBrowserLanguage";
import getStoredLanguage from "./getStoredLanguage";

/**
 * Custom hook that detects the user's preferred language and redirects
 * to the language-specific URL if necessary.
 */
export default function useLanguageDetector(): void {
	const navigate = useNavigate();

	useEffect(() => {
		// Priority order for language selection:
		// 1. Stored language preference (localStorage/cookies)
		// 2. Browser language detection
		// 3. Default fallback (en)

		const storedLang = getStoredLanguage();
		const browserLang = detectBrowserLanguage(navigator.language);

		// Use stored preference if available, otherwise browser detection
		const selectedLang = storedLang ?? browserLang;

		void navigate(`/${selectedLang}/`, { replace: true });
	}, [navigate]);
}
