import getPathWithoutLangImpl from "@/shared/language/getPathWithoutLang";

// React-local wrapper that delegates to the shared implementation so callers in
// the React tree can keep importing the same path as before.
export default function getPathWithoutLang(pathname: string): string {
	return getPathWithoutLangImpl(pathname);
}
