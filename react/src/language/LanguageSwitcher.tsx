import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { setStoredLanguage } from "./languageStorage";
import {
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "@/shared/language/supportedLanguages";

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: "English",
	es: "Español",
	zh: "中文",
};

export default function LanguageSwitcher(): ReactElement {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { lang } = useParams<{ lang: string }>();

	// Get current language from URL params, with fallback to 'en'
	const currentLang = (
		SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage) ? lang : "en"
	) as SupportedLanguage;

	// Extract the path without the language prefix
	const currentPath = location.pathname.substring(3) || "/";

	const handleLanguageChange = (newLang: SupportedLanguage): void => {
		if (newLang !== currentLang) {
			// Store the language preference
			setStoredLanguage(newLang);

			void navigate(`/${newLang}${currentPath}`);
		}
	};

	return (
		<select
			value={currentLang}
			onChange={(e) =>
				handleLanguageChange(e.target.value as SupportedLanguage)
			}
			className="rounded-md border border-gray-300 bg-white px-3 py-1 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
			aria-label={t("navigation.switchLanguage")}
		>
			{SUPPORTED_LANGUAGES.map((language) => (
				<option key={language} value={language}>
					{/* eslint-disable-next-line security/detect-object-injection */}
					{LANGUAGE_NAMES[language]}
				</option>
			))}
		</select>
	);
}
