import type { SupportedLanguageType } from "@/shared/language/supported-languages";

import getStoredLanguage from "../stored/getStoredLanguage";
import setStoredLanguage from "../stored/setStoredLanguage";

/**
 * Ensure a language preference exists; if missing, persist the provided language.
 *
 * This is a best-effort helper used from rendering code (effects). It swallows
 * errors so callers (render/effect paths) do not fail the UI.
 *
 * @param currentLang - ISO 2-letter supported language code
 */
export async function persistLanguagePreferenceIfMissing(
	currentLang: SupportedLanguageType,
): Promise<void> {
	// best-effort only — swallow errors to avoid impacting rendering
	await getStoredLanguage()
		.then(async (stored) => {
			if (stored === undefined) {
				await setStoredLanguage(currentLang);
			}
			return;
		})
		.catch(() => {
			// ignore errors
		});
}

export default persistLanguagePreferenceIfMissing;
