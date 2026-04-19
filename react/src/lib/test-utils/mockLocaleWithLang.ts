import { vi } from "vitest";

import type { UseLocaleResult } from "@/react/lib/language/locale/useLocale";

/**
 * Build an identity translation function for locale-related tests.
 *
 * The helper stays at module scope so tests reuse one typed implementation
 * instead of recreating it on every call.
 *
 * @returns A `t` function that falls back to the default or key.
 */
function makeIdentityT(): UseLocaleResult["t"] {
	// Narrow cast kept localized in the helper so tests don't need inline disables.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-type-assertion
	return ((key: string, def?: string): string =>
		typeof def === "string" ? def : key) as unknown as UseLocaleResult["t"];
}

/**
 * mockLocaleWithLang
 *
 * Test helper that stubs `useLocale()` with a predictable `lang` and a
 * no-op `t` translation function. Centralizes a single typed cast for the
 * i18n `t` function to avoid repeating inline disables across test files.
 *
 * @param lang - simulated language value (defaults to "en")
 * @returns void
 */
export default function mockLocaleWithLang(lang: UseLocaleResult["lang"] = "en"): void {
	// Use a module mock so callers can call this synchronously before importing
	// modules that depend on `useLocale()` in test files.
	vi.doMock("@/react/lib/language/locale/useLocale", () => ({
		default: (): UseLocaleResult => ({
			lang,
			t: makeIdentityT(),
		}),
	}));
}
