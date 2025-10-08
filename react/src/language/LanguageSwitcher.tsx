import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { setStoredLanguage } from "./languageStorage";
import {
	SupportedLanguage,
	type SupportedLanguageType,
	defaultLanguage,
	isSupportedLanguage,
	languageNames,
} from "@/shared/language/supportedLanguages";
import { safeGet } from "@/shared/utils/safe";

export default function LanguageSwitcher(): ReactElement {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { lang } = useParams<{ lang: string }>();

	// Get current language from URL params, with fallback to 'en'
	const currentLang = (
		isSupportedLanguage(lang) ? lang : defaultLanguage
	) as SupportedLanguageType;

	// Extract the path without the language prefix
	const currentPath = location.pathname.substring(3) || "/";

	const handleLanguageChange = (newLang: SupportedLanguageType): void => {
		if (newLang !== currentLang) {
			// Store the language preference
			setStoredLanguage(newLang);

			void navigate(`/${newLang}${currentPath}`);
		}
	};

	return (
		<select
			value={currentLang}
			onChange={(ev) =>
				handleLanguageChange(ev.target.value as SupportedLanguageType)
			}
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
