import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import type { SupportedLanguage } from "@/shared/language/supportedLanguages";

export function useLanguage(): {
	currentLanguage: SupportedLanguage;
	switchLanguage: (newLang: SupportedLanguage) => void;
	getLocalizedPath: (path: string, lang?: SupportedLanguage) => string;
} {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const currentLanguage = i18n.language as SupportedLanguage;
	const currentPath = location.pathname.substring(3) || "/";

	const switchLanguage = (newLang: SupportedLanguage): void => {
		if (newLang !== currentLanguage) {
			void navigate(`/${newLang}${currentPath}`);
		}
	};

	const getLocalizedPath = (path: string, lang?: SupportedLanguage): string => {
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
