import type { Paragraph } from "@/react/lib/language/paragraph";

import useLocale from "@/react/lib/language/locale/useLocale";
import normalizeTranslationParagraphs from "@/react/lib/language/normalizeTranslationParagraphs";
import { getEnvValueSafe } from "@/react/lib/utils/env";
import { reactFeaturesPath, uploadDemoPath } from "@/shared/paths";

export type UseHomeReturn = {
	lang: ReturnType<typeof useLocale>["lang"];
	t: ReturnType<typeof useLocale>["t"];
	appName: string;
	homeParagraphs: Paragraph[];
	reactFeaturesPath: string;
	uploadDemoPath: string;
};

/**
 * Compute localized values and translated paragraphs for the home page.
 *
 * - Reads `lang` and `t` from `useLocale()`
 * - Resolves the application name using `VITE_APP_NAME` or translation fallback
 * - Normalizes translated paragraphs for rendering
 *
 * @returns - values and translations used by the home UI
 */
export default function useHome(): UseHomeReturn {
	const { lang, t } = useLocale();
	// Prefer any non-null VITE_APP_NAME value (coerce to string) so tests and
	// runtime environments that set this value in different ways are handled.
	const rawAppName = getEnvValueSafe("APP_NAME");
	const appName = rawAppName === undefined ? (t("app.title") ?? "SongShare") : String(rawAppName);

	const translationConfig = { returnObjects: true, appName };
	const homeParagraphsRaw: unknown = t("pages.home.paragraphs", translationConfig);
	const homeParagraphs: Paragraph[] = normalizeTranslationParagraphs(homeParagraphsRaw);

	return { lang, t, appName, homeParagraphs, reactFeaturesPath, uploadDemoPath };
}
