import { useTranslation } from "react-i18next";

import {
	type SupportedLanguageType,
	defaultLanguage,
} from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Minimal hook that returns the current language as a type-safe SupportedLanguageType.
 * Falls back to defaultLanguage when the detected language is not supported.
 */
export function useLanguage(): SupportedLanguageType {
	const { i18n } = useTranslation();
	const raw = i18n?.language ?? defaultLanguage;
	return isSupportedLanguage(raw) ? raw : defaultLanguage;
}

export default useLanguage;
