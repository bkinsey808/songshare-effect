import buildPathWithLang from "@/shared/language/buildPathWithLang";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import getPublicWebBaseUrl from "./getPublicWebBaseUrl";

/**
 * Build a fully-qualified public URL for QR codes, including language prefix.
 *
 * @param pathname - Path segment like "/song/my-slug"
 * @param lang - Language prefix to apply
 * @returns A full URL when a base is available, otherwise the localized path
 */
export default function buildPublicWebUrl(pathname: string, lang: SupportedLanguageType): string {
	const localizedPath = buildPathWithLang(pathname, lang);
	const baseUrl = getPublicWebBaseUrl();
	return baseUrl === "" ? localizedPath : `${baseUrl}${localizedPath}`;
}
