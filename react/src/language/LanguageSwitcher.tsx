import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LANG_PREFIX_LENGTH } from "@/shared/constants/http";
import {
	SupportedLanguage,
	type SupportedLanguageType,
	defaultLanguage,
	languageNames,
} from "@/shared/language/supported-languages";
import {
	guardAsSupportedLanguage,
	isSupportedLanguage,
} from "@/shared/language/supported-languages-effect";
import { safeGet } from "@/shared/utils/safe";

import { setStoredLanguage } from "./languageStorage";

export default function LanguageSwitcher(): ReactElement {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { lang } = useParams<{ lang: string }>();

	// Get current language from URL params, with fallback to 'en'
	const currentLang = isSupportedLanguage(lang) ? lang : defaultLanguage;

	// Extract the path without the language prefix
	const currentPath = location.pathname.substring(LANG_PREFIX_LENGTH) || "/";

	function handleLanguageChange(newLang: SupportedLanguageType): void {
		if (newLang !== currentLang) {
			// Store the language preference
			setStoredLanguage(newLang);

			void navigate(`/${newLang}${currentPath}`);
		}
	}

	return (
		<select
			value={currentLang}
			onChange={(ev) => {
				handleLanguageChange(
					guardAsSupportedLanguage(ev.target.value as unknown),
				);
			}}
			className="rounded-md border border-gray-300 bg-white px-3 py-1 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
