import type { SupportedLanguageType } from "./supported-languages";

import getPathWithoutLang from "./getPathWithoutLang";

export default function buildPathWithLang(pathname: string, lang: SupportedLanguageType): string {
	const path = getPathWithoutLang(pathname);
	return path === "/" ? `/${lang}` : `/${lang}${path}`;
}
