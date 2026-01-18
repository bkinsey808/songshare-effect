/**
 * Small convenience hook that returns the i18n runtime language *and* the
 * translation function. Use this when a component needs both `lang` and
 * `t` together (UI + link-building). Prefer this wrapper over adding `t`
 * to `useLanguage()` so the single-responsibility of the original hook is
 * preserved.
 */
import { useTranslation } from "react-i18next";

// Use the exact `t` signature returned by `useTranslation` so callers get the
// same, well-typed translation function (prevents `any`-related lint errors).
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import useLanguage from "./useLanguage";

export type UseLocaleResult = {
	lang: SupportedLanguageType;
	t: ReturnType<typeof useTranslation>["t"];
};

/**
 * Return the i18n runtime language (narrowed) and the `t` translation
 * function in a single, ergonomic object.
 *
 * - Keep `useLanguage()` focused on language-only responsibilities.
 * - Use `useLocale()` when you need both `lang` and `t` in the same
 *   component (common in UI + localized-link building).
 */
export default function useLocale(): UseLocaleResult {
	const lang = useLanguage();
	const { t } = useTranslation();
	return { lang, t };
}
