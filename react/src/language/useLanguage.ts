import { useTranslation } from "react-i18next";

import type { SupportedLanguageType } from "@/shared/language/supportedLanguages";
import {
	defaultLanguage,
	isSupportedLanguage,
} from "@/shared/language/supportedLanguages";

/**
 * Minimal hook that returns the current language as a type-safe SupportedLanguageType.
 * Falls back to defaultLanguage when the detected language is not supported.
 */
export const useLanguage = (): SupportedLanguageType => {
	const { i18n } = useTranslation();
	const raw = i18n?.language ?? defaultLanguage;
	return isSupportedLanguage(raw)
		? (raw as SupportedLanguageType)
		: defaultLanguage;
};

export default useLanguage;
