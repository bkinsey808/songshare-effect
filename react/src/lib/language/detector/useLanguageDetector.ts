import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import detectBrowserLanguage from "@/shared/language/detectBrowserLanguage";

import getStoredLanguage from "../stored/getStoredLanguage";

/**
 * Custom hook that detects the user's preferred language and redirects
 * to the language-specific URL if necessary.
 *
 * Uses the async Cookie Store API when available to prefer the user's
 * explicit stored preference; falls back to synchronous helper for
 * environments that require it.
 *
 * @returns void
 */
export default function useLanguageDetector(): void {
	const navigate = useNavigate();

	// perform language detection once on mount and redirect if needed
	useEffect((): (() => void) => {
		let mounted = true;

		async function run(): Promise<void> {
			// Priority order for language selection:
			// 1. Stored language preference (Cookie Store API -> localStorage/cookies)
			// 2. Browser language detection
			// 3. Default fallback (en)

			const storedLang = await getStoredLanguage();
			// ensure the input to the detector is a string (guards test stubs) and
			// explicitly annotate the result to avoid `any` flow
			const browserLang: ReturnType<typeof detectBrowserLanguage> = detectBrowserLanguage(
				typeof navigator === "object" ? String(navigator.language) : undefined,
			);

			// Use stored preference if available, otherwise browser detection
			const selectedLang: ReturnType<typeof detectBrowserLanguage> = storedLang ?? browserLang;

			if (!mounted) {
				return;
			}
			void navigate(`/${selectedLang}/`, { replace: true });
		}

		void run();

		return (): void => {
			mounted = false;
		};
	}, [navigate]);
}
