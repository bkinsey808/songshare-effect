import { LANG_PATH_SEGMENT_INDEX } from "@/shared/constants/http";
import { defaultLanguage, type SupportedLanguageType } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * Strict parser: return a validated SupportedLanguageType extracted from a
 * pathname's language segment. This is a pure, easily-testable utility that
 * should be used where the caller requires a supported language value.
 *
 * - Returns a `SupportedLanguageType` (never a plain `string`).
 * - Falls back to `defaultLanguage` when the extracted segment is missing or
 *   unsupported.
 *
 * Example:
 *   getCurrentLangFromPath('/es/songs') // => 'es'
 *   getCurrentLangFromPath('/zz/foo')   // => defaultLanguage ('en')
 *
 * @param pathname - The URL pathname to parse
 * @returns The supported language extracted from the pathname or the `defaultLanguage`
 */
export default function getCurrentLangFromPath(pathname: string): SupportedLanguageType {
	const maybeLang = pathname.split("/")[LANG_PATH_SEGMENT_INDEX] ?? "";
	if (isSupportedLanguage(maybeLang)) {
		return maybeLang;
	}
	return defaultLanguage;
}
