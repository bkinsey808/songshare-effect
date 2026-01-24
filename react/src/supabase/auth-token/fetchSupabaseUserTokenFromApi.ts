import { apiUserTokenPath } from "@/shared/paths";

import { cacheUserToken, getCachedUserToken } from "../token/tokenCache";

let inFlightPromise: Promise<string | undefined> | undefined = undefined;

/**
 * Fetch the Supabase user token from the backend API.
 *
 * Deduplicates concurrent requests by returning the same in-flight promise.
 * If a valid token is already cached, returns it immediately.
 */
export default function fetchSupabaseUserTokenFromApi(): Promise<string | undefined> {
	// 1. Check if we already have a valid token
	const cached = getCachedUserToken();
	if (cached !== undefined) {
		return Promise.resolve(cached);
	}

	// 2. Check if a fetch is already in progress
	if (inFlightPromise) {
		console.warn("[fetchSupabaseUserTokenFromApi] waiting for IN-FLIGHT promise...");
		return inFlightPromise;
	}

	console.warn("[fetchSupabaseUserTokenFromApi] starting NEW fetch...");
	inFlightPromise = (async (): Promise<string | undefined> => {
		const FETCH_TIMEOUT_MS = 10_000;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
		}, FETCH_TIMEOUT_MS);

		try {
			console.warn("[fetchSupabaseUserTokenFromApi] calling fetch...");
			const response = await fetch(apiUserTokenPath as string, {
				method: "GET",
				credentials: "include",
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});

			if (!response.ok) {
				console.error("[fetchSupabaseUserTokenFromApi] fetch failed with status:", response.status);
				return undefined;
			}

			console.warn("[fetchSupabaseUserTokenFromApi] fetch response received, parsing...");
			const data: unknown = await response.json().catch(() => undefined);

			// Unwrap the response envelope {success: true, data: {...}}
			let tokenData: unknown = data;
			if (
				typeof data === "object" &&
				data !== null &&
				"success" in data &&
				data.success === true &&
				"data" in data
			) {
				tokenData = data.data;
			}

			if (
				typeof tokenData === "object" &&
				tokenData !== null &&
				"access_token" in tokenData &&
				typeof tokenData.access_token === "string" &&
				"expires_in" in tokenData &&
				typeof tokenData.expires_in === "number"
			) {
				const MS_IN_SECOND = 1000;
				const expiryTime = Date.now() + tokenData.expires_in * MS_IN_SECOND;
				cacheUserToken(tokenData.access_token, expiryTime);
				return tokenData.access_token;
			}

			return undefined;
		} catch (error) {
			const name =
				typeof error === "object" && error !== null ? (error as { name?: string }).name : "";
			if (name === "AbortError") {
				console.error("[fetchSupabaseUserTokenFromApi] FETCH TIMED OUT after 10s");
			} else {
				console.error("[fetchSupabaseUserTokenFromApi] Error:", error);
			}
			return undefined;
		} finally {
			clearTimeout(timeoutId);
			inFlightPromise = undefined;
		}
	})();

	return inFlightPromise;
}
