import { LANG_PATH_SEGMENT_INDEX } from "@/shared/constants/http";
import { defaultLanguage } from "@/shared/language/supported-languages";

/**
 * Loose extractor: return the raw language segment from the pathname or the
 * default language when missing. Use this when you must preserve unknown
 * path segments verbatim (for example, round-tripping legacy links).
 *
 * Note: prefer the strict `getCurrentLangFromPath` for most callers that
 * expect a supported language value.
 */
export default function getRawLangFromPath(pathname: string): string {
	const maybeLang = pathname.split("/")[LANG_PATH_SEGMENT_INDEX] ?? "";
	return maybeLang || defaultLanguage;
}
