import { useTranslation } from "react-i18next";
import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * Interpolate `{{var}}` placeholders in a template string using the provided vars.
 *
 * @param template - Template string containing placeholders
 * @param vars - Optional map of placeholder names to values
 * @returns The interpolated string
 */
function interpolateTemplate(template: string, vars?: Record<string, unknown>): string {
	if (vars === undefined) {
		return template;
	}

	let output = template;
	for (const [entryKey, entryVal] of Object.entries(vars)) {
		output = output.replaceAll(`{{ ${entryKey} }}`, String(entryVal));
		output = output.replaceAll(`{{${entryKey}}}`, String(entryVal));
	}

	return output;
}

/**
 * mockUseTranslation
 *
 * Centralized test helper to stub `useTranslation()` with a predictable
 * language and a simple `t` implementation. Keeps tests free of inline
 * unsafe type assertions and avoids repeated oxlint-disable comments.
 *
 * @param lang - Language code to expose from the mocked hook.
 * @returns void
 */
export default function mockUseTranslation(lang = "en"): void {
	// Construct a typed stub matching `useTranslation()` return shape and cast
	// once to the official return type. Narrowing here keeps tests concise.
	const stub = {
		t: (
			key: string,
			def?: string | Record<string, unknown>,
			vars?: Record<string, unknown>,
		): string => (typeof def === "string" ? interpolateTemplate(def, vars) : `X:${key}`),
		i18n: { language: lang, languages: ["en", "es"], changeLanguage: vi.fn() },
	};

	vi.mocked(useTranslation).mockReturnValue(forceCast<ReturnType<typeof useTranslation>>(stub));
}
