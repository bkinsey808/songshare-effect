import { LANG_PATH_SEGMENT_INDEX } from "@/shared/constants/http";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

/**
 * See react implementation for behavior — this is the shared canonical copy so
 * server and client can rely on the same logic.
 *
 * @param pathname - URL pathname potentially containing a leading language segment
 * @returns Pathname with the language segment removed (or `/` when root)
 */
export default function getPathWithoutLang(pathname: string): string {
	if (!pathname || pathname === "/") {
		return "/";
	}

	const segments = pathname.split("/");
	const maybeLang = segments[LANG_PATH_SEGMENT_INDEX] ?? "";

	if (isSupportedLanguage(maybeLang)) {
		const [, ...afterLang] = segments.slice(LANG_PATH_SEGMENT_INDEX);
		const withoutLang = ["", ...afterLang].join("/");
		return withoutLang === "" ? "/" : withoutLang;
	}

	return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
