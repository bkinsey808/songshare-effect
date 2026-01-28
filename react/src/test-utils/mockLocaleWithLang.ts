import { vi } from "vitest";

import useLocale from "@/react/language/locale/useLocale";

// Helper: create an identity `t` translation function typed to the runtime
// `useTranslation()` signature. Keep the unsafe cast localized here and
// documented so individual tests don't need their own eslint-disable comments.
function makeIdentityT(): ReturnType<typeof useLocale>["t"] {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion -- test-only identity translator
	return ((key: string) => key) as unknown as ReturnType<typeof useLocale>["t"];
}

/**
 * mockLocaleWithLang
 *
 * Test helper that stubs `useLocale()` with a predictable `lang` and a
 * no-op `t` translation function. Centralizes a single typed cast for the
 * i18n `t` function to avoid repeating inline disables across test files.
 *
 * @param lang - simulated language value (defaults to "en")
 */
export default function mockLocaleWithLang(
	lang: ReturnType<typeof useLocale>["lang"] = "en",
): void {
	vi.mocked(useLocale).mockImplementation(
		(): ReturnType<typeof useLocale> => ({
			lang,
			// Default to identity function so tests can expect translation keys to be used as labels
			t: makeIdentityT(),
		}),
	);
}
