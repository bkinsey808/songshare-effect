import { useTranslation } from "react-i18next";

import { type SupportedLanguageType, defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Return a validated runtime language for translation lookups.
 *
 * @returns The validated runtime language to use for translation lookups
 */
export default function useLanguage(): SupportedLanguageType {
	const { i18n } = useTranslation();
	const raw = i18n?.language ?? defaultLanguage;
	return isSupportedLanguage(raw) ? raw : defaultLanguage;
}
