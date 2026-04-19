import { preferredLanguageCookieName } from "@/shared/cookies";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";

/**
 * Persist the user's preferred language.
 *
 * - Prefer the modern Cookie Store API when available (async, safer).
 * - Fall back to `document.cookie` for older browsers.
 * - Always write to `localStorage` as a synchronous fallback for client-side reads.
 *
 * @param language - ISO 2-letter supported language code
 * @returns void
 */
function setStoredLanguageSync(language: SupportedLanguageType): void {
	if (typeof document !== "undefined") {
		const expires = new Date();
		const DAYS_IN_YEAR = 365;
		expires.setDate(expires.getDate() + DAYS_IN_YEAR);
		const secureFlag = location.protocol === "https:";

		/* oxlint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion */
		// Fallback for legacy browsers: write a cookie header string. This is
		// intentionally scoped and lint-suppressed — prefer Cookie Store above.
		// oxlint-disable-next-line unicorn/no-document-cookie
		document.cookie = `${preferredLanguageCookieName}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureFlag ? "; Secure" : ""}`;
	}
	if (typeof globalThis !== "undefined") {
		localStorage.setItem("preferred-language", language);
	}
}

/**
 * Async public API that persists the preferred language.
 *
 * @param language - ISO 2-letter supported language code
 * @returns Promise that resolves once persistence is complete
 */
export default async function setStoredLanguage(language: SupportedLanguageType): Promise<void> {
	if (typeof document === "undefined") {
		// still write localStorage when possible
		if (typeof globalThis !== "undefined") {
			localStorage.setItem("preferred-language", language);
		}
		return;
	}

	// Prefer Cookie Store API when available (async, safer)
	if (typeof cookieStore !== "undefined" && typeof cookieStore.set === "function") {
		try {
			const expires = new Date();
			const DAYS_IN_YEAR = 365;
			expires.setDate(expires.getDate() + DAYS_IN_YEAR);
			await cookieStore.set({
				name: preferredLanguageCookieName,
				value: language,
				expires: expires.getTime(),
				path: "/",
				sameSite: "lax",
			});
			if (typeof globalThis !== "undefined") {
				localStorage.setItem("preferred-language", language);
			}
			return;
		} catch {
			// fall through to the sync fallback below
		}
	}

	// Fallback to sync path for older browsers
	setStoredLanguageSync(language);
}
