import type { SupportedLanguageType } from "./supported-languages";

import getPathWithoutLang from "./getPathWithoutLang";

/**
 * Prepend the language prefix to a pathname, preserving the non-language path.
 *
 * @param pathname - The original pathname (may already include a language segment)
 * @param lang - The desired language prefix to apply
 * @returns The pathname prefixed with the language (e.g., "/en/foo")
 */
export default function buildPathWithLang(pathname: string, lang: SupportedLanguageType): string {
	const path = getPathWithoutLang(pathname);
	return path === "/" ? `/${lang}` : `/${lang}${path}`;
}
