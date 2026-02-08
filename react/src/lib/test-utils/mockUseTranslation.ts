import { useTranslation } from "react-i18next";
import { vi } from "vitest";

/**
 * mockUseTranslation
 *
 * Centralized test helper to stub `useTranslation()` with a predictable
 * language and a simple `t` implementation. Keeps tests free of inline
 * unsafe type assertions and avoids repeated eslint-disable comments.
 *
 * @returns void
 */
export default function mockUseTranslation(lang = "en"): void {
	// `react-i18next` types are complex (branded `TFunction` and a full `i18n`
	// instance). Centralize a single narrow cast here so individual tests can
	// stub `useTranslation()` without repeating verbose disables.
	/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- testing helper central cast */
	vi.mocked(useTranslation).mockReturnValue({
		t: (key: string): string => `X:${key}`,
		i18n: { language: lang, languages: ["en", "es"], changeLanguage: vi.fn() },
	} as unknown as ReturnType<typeof useTranslation>);
}
