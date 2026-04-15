import { preferredLanguageCookieName } from "@/shared/cookies";
import type { SupportedLanguageType } from "@/shared/language/supported-languages";
import { isSupportedLanguage } from "@/shared/language/supported-languages-effect";

import parseLanguageCookie from "./parseLanguageCookie";

/**
 * Synchronously read the preferred language from localStorage or document
 * cookies. This helper is used as a fallback when the Cookie Store API is
 * unavailable.
 *
 * @returns The stored supported language, or `undefined` if none found
 */
function getStoredLanguageSync(): SupportedLanguageType | undefined {
	// First try to get from localStorage (client-side)
	if (typeof globalThis !== "undefined") {
		const stored = localStorage.getItem("preferred-language");
		if (isSupportedLanguage(stored)) {
			return stored;
		}
	}

	// Then try to get from cookies (works on both client and server)
	if (typeof document !== "undefined") {
		// Prefer `undefined` over `null` per repo conventions and guard the value
		const cookieHeader: string | undefined =
			typeof document.cookie === "string" && document.cookie.trim() !== ""
				? document.cookie
				: undefined;
		if (cookieHeader !== undefined) {
			const cookieValue = parseLanguageCookie(cookieHeader);
			if (cookieValue !== undefined) {
				return cookieValue;
			}
		}
	}

	return undefined;
}

/**
 * Async public API that prefers the modern Cookie Store API when available.
 *
 * - Public (async) API: `getStoredLanguage()` / default export
 * - Internal sync helper: `getStoredLanguageSync()` (not exported)
 *
 * Callers that can await should prefer this function; sync-only callers
 * should continue to read `localStorage` / `document.cookie` directly.
 */
/**
 * Async public API that resolves the stored supported language.
 *
 * @returns A promise resolving to the stored supported language or `undefined`
 */
export default async function getStoredLanguage(): Promise<SupportedLanguageType | undefined> {
	// Prefer Cookie Store API when available (async, safer)
	if (typeof cookieStore !== "undefined" && typeof cookieStore.get === "function") {
		try {
			const ck = await cookieStore.get(preferredLanguageCookieName);
			const val = ck?.value ?? undefined;
			if (isSupportedLanguage(val)) {
				return val;
			}
		} catch {
			// Swallow errors and fall back to synchronous path below
		}
	}

	// Fall back to the synchronous, well-tested implementation (internal)
	return getStoredLanguageSync();
}
