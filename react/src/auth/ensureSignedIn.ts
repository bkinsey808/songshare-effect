// Prefer per-line console exceptions

import { getCachedUserToken } from "@/react/supabase/token/tokenCache";
import { clientDebug, clientError } from "@/react/utils/clientLogger";
import { getStoreApi } from "@/react/zustand/useAppStore";
import { HTTP_NO_CONTENT, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "@/shared/constants/http";
import { apiMePath } from "@/shared/paths";
import { type UserSessionData } from "@/shared/userSessionData";
import { isRecord } from "@/shared/utils/typeGuards";

// Module-level in-flight promise to dedupe concurrent requests.
// Initialized to undefined to satisfy init-declarations lint rule
let globalInFlight: Promise<UserSessionData | undefined> | undefined = undefined;

// Validate payload shape and return UserSessionData if valid, otherwise undefined
function parsePayload(payload: unknown): UserSessionData | undefined {
	function isSuccessWrapper(value: unknown): value is { success: true; data: unknown } {
		if (!isRecord(value)) {
			return false;
		}
		return Object.hasOwn(value, "data") && value["data"] !== undefined;
	}

	function isUserSessionData(value: unknown): value is UserSessionData {
		if (!isRecord(value)) {
			return false;
		}
		return Object.hasOwn(value, "user");
	}

	if (isSuccessWrapper(payload)) {
		const { data } = payload as { data: unknown };
		if (isUserSessionData(data)) {
			return data;
		}
	}

	if (isUserSessionData(payload)) {
		return payload;
	}
	return undefined;
}

/**
 * Ensure signed-in state by calling /api/me. Exported so non-hook code can
 * force a refresh when needed.
 */
export default function ensureSignedIn(options?: {
	readonly force?: boolean;
}): Promise<UserSessionData | undefined> {
	const force = options?.force ?? false;
	// Localized debug-only log
	clientDebug("[ensureSignedIn] called, force=", force);

	// Get store API
	const api = getStoreApi();

	const currentIsSignedIn = api.getState().isSignedIn;

	// If not forced and we already know the sign-in state, skip network call
	// only if we either know we are NOT signed in, or we ARE signed in and
	// have a valid cached token. If we are signed in but missing a token
	// (common after page refresh), we must proceed to trigger a token fetch.
	if (
		!force &&
		currentIsSignedIn !== undefined &&
		(!currentIsSignedIn || getCachedUserToken() !== undefined)
	) {
		// callers expect a Promise<UserSessionData | undefined>
		return Promise.resolve(undefined);
	}

	if (globalInFlight) {
		// Localized debug-only log
		clientDebug("[ensureSignedIn] using globalInFlight promise");
		return globalInFlight;
	}

	const controller = new AbortController();

	const promise = (async (): Promise<UserSessionData | undefined> => {
		try {
			const res = await fetch(apiMePath, {
				method: "GET",
				credentials: "include",
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});

			// Treat common unauthenticated responses as "not signed in" quietly
			if (
				res.status === HTTP_UNAUTHORIZED ||
				res.status === HTTP_NO_CONTENT ||
				res.status === HTTP_NOT_FOUND
			) {
				api.getState().setIsSignedIn(false);
				return undefined;
			}

			// Localized debug-only log
			clientDebug("[ensureSignedIn] /api/me response status=", res.status);

			if (!res.ok) {
				// For other non-OK statuses (server errors), log for debugging
				// Localized: server-side error log
				clientError("[ensureSignedIn] unexpected non-OK /api/me status:", res.status);
				api.getState().setIsSignedIn(false);
				return undefined;
			}

			const payload: unknown = await res.json().catch((error: unknown) => {
				// Localized: error parsing response
				clientError("useEnsureSignedIn json error", error);
				return undefined;
			});

			// Debug: log the raw payload for troubleshooting OAuth redirect cases
			// Localized debug-only log
			clientDebug("[ensureSignedIn] payload=", payload);

			const data = parsePayload(payload);
			return data;
		} catch (error) {
			const isAbort =
				typeof error === "object" &&
				error !== null &&
				(error as { name?: unknown }).name === "AbortError";
			if (isAbort) {
				return undefined;
			}
			// Localized: report unexpected error
			clientError("ensureSignedIn error", error);
			return undefined;
		} finally {
			globalInFlight = undefined;
		}
	})();

	// When the fetch completes, only apply the sign-in result if the client
	// hasn't been explicitly signed out in the meantime. Use an async IIFE
	// to avoid complex chained `.then` expressions which have caused the
	// dev transform to fail in the past.
	globalInFlight = (async (): Promise<UserSessionData | undefined> => {
		const data = await promise;
		try {
			const storeApi = getStoreApi();

			const current = storeApi.getState().isSignedIn;
			// If the client explicitly signed out while the request was in-flight,
			// do not re-apply the sign-in result unless this call was forced by
			// the caller (for example, the OAuth redirect flow uses force=true).
			if (current === false && !force) {
				return undefined;
			}

			if (data === undefined) {
				// Debug: no data parsed
				clientDebug("[ensureSignedIn] parsed no userSessionData from payload");
			} else {
				// Debug: indicate we're about to apply sign-in
				clientDebug("[ensureSignedIn] applying signIn, user=", data.user?.user_id ?? "<unknown>");
				const signInFn = storeApi.getState().signIn;
				const setIsSignedInFn = storeApi.getState().setIsSignedIn;
				try {
					signInFn?.(data);
					setIsSignedInFn?.(true);
				} catch (error) {
					// Localized: report error applying sign-in
					clientError("apply signIn failed:", error);
				}
			}

			return data;
		} catch (error) {
			// Localized: report post-process error
			clientError("post-process ensureSignedIn error", error);
			return data;
		}
	})();

	return globalInFlight;
}
