import { useTranslation } from "react-i18next";

import { type SupportedLanguageType, defaultLanguage } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Translation/runtime-language hook (i18n source-of-truth).
 *
 * Purpose
 * - Reads the language from the react-i18next runtime (`i18n.language`) and
 *   returns a *validated* `SupportedLanguageType`.
 * - This hook is the canonical source for UI text/translation decisions —
 *   components that render translated strings should prefer this hook.
 *
 * Key guarantees
 * - Returns a narrow `SupportedLanguageType` (not an arbitrary string).
 * - Falls back to `defaultLanguage` when the i18n runtime contains an
 *   unsupported/unknown value.
 *
 * When to use
 * - Use for translation lookups, `i18n.changeLanguage` side-effects, and any
 *   logic that must reflect the i18n instance's current language.
 * - Do NOT use this for URL-driven routing decisions (use
 *   `useCurrentLang` / `getCurrentLangFromPath` instead).
 *
 * Examples
 * - UI text: `const lang = useLanguage(); const label = t('foo', { lng: lang })`
 * - Feature gating: `if (useLanguage() !== 'en') { ... }`
 *
 * Testing notes
 * - Unit-test by mocking the i18n instance (preferred) or by asserting the
 *   returned `SupportedLanguageType` from `useLanguage()` in a mounted
 *   component with a configured i18n provider.
 *
 * Migration guidance
 * - If a component previously derived the language from the pathname, only
 *   switch to `useLanguage()` when the i18n runtime should be authoritative.
 * - For components that need both (URL + i18n), consider `useLocale()` as an
 *   aggregator (suggested follow-up) so consumers explicitly choose a source.
 */
export default function useLanguage(): SupportedLanguageType {
	const { i18n } = useTranslation();
	const raw = i18n?.language ?? defaultLanguage;
	return isSupportedLanguage(raw) ? raw : defaultLanguage;
}
