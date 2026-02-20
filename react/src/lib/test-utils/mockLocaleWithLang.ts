import { vi } from "vitest";

import type { UseLocaleResult } from "@/react/lib/language/locale/useLocale";

// Helper: identity `t` translation function typed to the runtime
// `useTranslation()` signature. Defined at module scope to avoid recreating
// it on every call.
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
