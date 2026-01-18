import { useLocation } from "react-router-dom";

import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import getCurrentLangFromPath from "./path/getCurrentLangFromPath";

/**
 * URL-based language utilities and a small React hook.
 *
 * Purpose
 * - Centralises the logic for deriving a language value from a URL pathname
 *   segment (e.g. `/<lang>/songs/...`).
 * - Provides a strict parser (`getCurrentLangFromPath`) that only returns a
 *   `SupportedLanguageType` and a *loose* extractor (`getRawLangFromPath`) that
 *   preserves raw/unvalidated path segments (used to preserve legacy behaviour
 *   in some routing flows).
 * - Exposes `useCurrentLang` which is reactive inside a `react-router` tree.
 *
 * Why this exists (vs `useLanguage` which reads i18n):
 * - `useLanguage()` answers "what language is the i18n runtime using?" — use
 *   it for translation lookups and UI that depends on the i18n instance.
 * - `useCurrentLang()` answers "what language is encoded in the current URL?"
 *   — use it for routing, building localized links, redirects and historic
 *   flows where the path is the source-of-truth.
 *
 * Key behaviours
 * - getCurrentLangFromPath(path): strict → returns only supported languages.
 * - getRawLangFromPath(path): loose  → returns raw segment or `defaultLanguage`.
 * - useCurrentLang(opts?): reactive; accepts `opts.pathname` for SSR/tests.
 *
 * Usage guidance / examples
 * - Routing / link building: use `useCurrentLang()` or `getRawLangFromPath()` to
 *   preserve the exact segment you will render into URLs (keeps behaviour
 *   backward-compatible).
 * - UI / translations: prefer `useLanguage()` (see `react/src/language/useLanguage.ts`).
 *
 * Testing
 * - `useCurrentLang({ pathname: '/es/songs' })` lets you unit-test hook logic
 *   without mounting a Router.
 * - `getCurrentLangFromPath` is pure and should be unit-tested for edge cases
 *   (missing segment, unsupported values).
 *
 * Migration note
 * - Do **not** blindly replace `useLanguage()` with `useCurrentLang()` — pick
 *   the hook that matches whether i18n or the URL is the authority for the
 *   calling component. Consider adding a `useLocale()` aggregator if you need
 *   both values in many places.
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
