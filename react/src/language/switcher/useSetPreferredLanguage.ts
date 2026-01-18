import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import buildPathWithLang from "@/shared/language/buildPathWithLang";

import getPathWithoutLang from "../path/getPathWithoutLang";
import setStoredLanguage from "../stored/setStoredLanguage";

type SetPreferredOpts = {
	/** If true navigate to the new language path (default: true) */
	navigate?: boolean;
	/** optional path to navigate to (defaults to current path without lang) */
	path?: string;
	replace?: boolean;
};

/**
 * Hook: centralises preference persistence + optional navigation.
 *
 * - Persists preference via `setStoredLanguage()` (Cookie Store or fallback)
 * - Optionally navigates to a localized URL (common UI pattern)
 * - Returns a stable callback suitable for event handlers
 */
export default function useSetPreferredLanguage(): (
	newLang: SupportedLanguageType,
	opts?: SetPreferredOpts,
) => void {
	const navigate = useNavigate();
	const location = useLocation();

	return function setPreferredLanguage(
		newLang: SupportedLanguageType,
		opts?: SetPreferredOpts,
	): void {
		const safeOpts = opts ?? {};
		const doNavigate = safeOpts.navigate ?? true;
		const path = safeOpts.path ?? getPathWithoutLang(location.pathname);
		const replace = safeOpts.replace ?? false;

		// Persist preference (async-first). Fire-and-forget for UI handlers.
		void setStoredLanguage(newLang);

		if (doNavigate) {
			void navigate(buildPathWithLang(path, newLang), { replace });
		}
	};
}
