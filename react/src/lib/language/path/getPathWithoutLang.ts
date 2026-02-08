import getPathWithoutLangImpl from "@/shared/language/getPathWithoutLang";

/**
 * React wrapper that delegates to the shared `getPathWithoutLang` implementation.
 * Use this when consumers inside the React tree need the pathname without language prefix.
 *
 * @param pathname - The full pathname possibly containing a language segment
 * @returns The pathname with the language segment removed (if present)
 */
export default function getPathWithoutLang(pathname: string): string {
	return getPathWithoutLangImpl(pathname);
}
