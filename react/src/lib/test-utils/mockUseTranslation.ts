import { useTranslation } from "react-i18next";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * mockUseTranslation
 *
 * Centralized test helper to stub `useTranslation()` with a predictable
 * language and a simple `t` implementation. Keeps tests free of inline
 * unsafe type assertions and avoids repeated oxlint-disable comments.
 *
 * @returns void
 */
export default function mockUseTranslation(lang = "en"): void {
	// Construct a typed stub matching `useTranslation()` return shape and cast
	// once to the official return type. Narrowing here keeps tests concise.
	const stub = {
		t: (key: string, def?: string): string => (typeof def === "string" ? def : `X:${key}`),
		i18n: { language: lang, languages: ["en", "es"], changeLanguage: vi.fn() },
	};

	vi.mocked(useTranslation).mockReturnValue(forceCast<ReturnType<typeof useTranslation>>(stub));
}
