import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import {
	SupportedLanguage,
	type SupportedLanguageType,
	languageNames,
} from "@/shared/language/supported-languages";
import { guardAsSupportedLanguage } from "@/shared/language/supported-languages-effect";
import { safeGet } from "@/shared/utils/safe";

import getPathWithoutLang from "../path/getPathWithoutLang";
import useCurrentLang from "../useCurrentLang";
import useSetPreferredLanguage from "./useSetPreferredLanguage";

/**
 * Language selection dropdown used to change the application's preferred language.
 * Persists the user's preference and optionally navigates to the same path under the
 * newly selected language.
 *
 * @returns A select element allowing the user to switch languages
 */
export default function LanguageSwitcher(): ReactElement {
	const { t } = useTranslation();
	const location = useLocation();
	const currentLang = useCurrentLang();
	const setPreferred = useSetPreferredLanguage();

	// Extract the path without the language prefix
	// Use dedicated path util so callers don't need to know LANG_PREFIX_LENGTH
	const currentPath = getPathWithoutLang(location.pathname);

	function handleLanguageChange(newLang: SupportedLanguageType): void {
		if (newLang !== currentLang) {
			// Centralised persistence + navigation (fire-and-forget)
			setPreferred(newLang, { path: currentPath });
		}
	}

	return (
		<select
			value={currentLang}
			onChange={(ev) => {
				handleLanguageChange(guardAsSupportedLanguage(ev.target.value));
			}}
			className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
			aria-label={t("navigation.switchLanguage")}
		>
			{Object.values(SupportedLanguage).map((language) => (
				<option key={language} value={language}>
					{safeGet(languageNames, language)}
				</option>
			))}
		</select>
	);
}
