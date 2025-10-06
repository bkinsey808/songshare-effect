import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";

export function useLanguage(): {
	currentLanguage: SupportedLanguageType;
	switchLanguage: (newLang: SupportedLanguageType) => void;
	getLocalizedPath: (path: string, lang?: SupportedLanguageType) => string;
} {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const currentLanguage = i18n.language as SupportedLanguageType;
	const currentPath = location.pathname.substring(3) || "/";

	const switchLanguage = (newLang: SupportedLanguageType): void => {
		if (newLang !== currentLanguage) {
			void navigate(`/${newLang}${currentPath}`);
		}
	};

	const getLocalizedPath = (
		path: string,
		lang?: SupportedLanguageType,
	): string => {
		const targetLang = lang || currentLanguage;
		const cleanPath = path.startsWith("/") ? path : `/${path}`;
		return `/${targetLang}${cleanPath}`;
	};

	return {
		currentLanguage,
		switchLanguage,
		getLocalizedPath,
	};
}
