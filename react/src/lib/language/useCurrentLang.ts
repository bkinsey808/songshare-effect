import { useLocation } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import getCurrentLangFromPath from "./path/getCurrentLangFromPath";

/**
 * Returns the supported language determined from the current URL pathname.
 *
 * @param opts - Optional test/SSR overrides (e.g., `{ pathname }`)
 * @returns The supported language determined from the current URL pathname
 */

export default function useCurrentLang(opts?: { pathname?: string }): SupportedLanguageType {
	// Call `useLocation` unconditionally so the hook is reactive inside a
	// Router (keeps hook call order stable). Tests should mock `useLocation`.
	const location = useLocation();

	const pathname =
		opts?.pathname ??
		location?.pathname ??
		(typeof globalThis === "undefined" ? "/" : globalThis.location.pathname);

	return getCurrentLangFromPath(pathname);
}
