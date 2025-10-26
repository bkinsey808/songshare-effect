/* eslint-disable no-console */
import { useEffect, useRef } from "react";
import type { StoreApi } from "zustand";

import {
	type AppSlice,
	getOrCreateAppStore,
	getStoreApi,
} from "@/react/zustand/useAppStore";
import { apiMePath } from "@/shared/paths";
import type { UserSessionData } from "@/shared/userSessionData";

// Module-level in-flight promise to dedupe concurrent requests.
let globalInFlight: Promise<UserSessionData | undefined> | undefined;

// Validate payload shape and return UserSessionData if valid, otherwise undefined
function parsePayload(payload: unknown): UserSessionData | undefined {
	const isSuccessWrapper = (
		value: unknown,
	): value is { success: true; data: unknown } => {
		if (typeof value !== "object" || value === null) {
			return false;
		}
		const obj = value as Record<string, unknown>;
		return (
			Object.prototype.hasOwnProperty.call(obj, "data") &&
			obj["data"] !== undefined
		);
	};

	const isUserSessionData = (value: unknown): value is UserSessionData => {
		if (typeof value !== "object" || value === null) {
			return false;
		}
		const obj = value as Record<string, unknown>;
		return Object.prototype.hasOwnProperty.call(obj, "user");
	};

	if (isSuccessWrapper(payload)) {
		const data = (payload as { data: unknown }).data;
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
export async function ensureSignedIn(options?: {
	force?: boolean;
}): Promise<UserSessionData | undefined> {
	const force = options?.force ?? false;
	console.debug("[ensureSignedIn] called, force=", force);

	// Ensure store exists and get API
	let api = getStoreApi();
	if (!api) {
		api = getOrCreateAppStore();
	}

	const currentIsSignedIn = api.getState().isSignedIn;

	// If not forced and we already know the sign-in state, skip network call
	if (!force && currentIsSignedIn !== undefined) {
		return undefined;
	}

	if (globalInFlight) {
		console.debug("[ensureSignedIn] using globalInFlight promise");
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

			console.debug("[ensureSignedIn] /api/me response status=", res.status);

			if (!res.ok) {
				// mark signed out when server indicates no session
				api.getState().setIsSignedIn(false);
				return undefined;
			}

			const payload: unknown = await res.json().catch((err) => {
				console.error("useEnsureSignedIn json error", err);
				return undefined;
			});

			// Debug: log the raw payload for troubleshooting OAuth redirect cases
			console.debug("[ensureSignedIn] payload=", payload);

			const data = parsePayload(payload);
			return data;
		} catch (err) {
			const isAbort =
				typeof err === "object" &&
				err !== null &&
				"name" in err &&
				(err as { name?: unknown }).name === "AbortError";
			if (isAbort) {
				return undefined;
			}
			console.error("ensureSignedIn error", err);
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
			if (!storeApi) {
				return data;
			}

			const current = storeApi.getState().isSignedIn;
			// If the client explicitly signed out while the request was in-flight,
			// do not re-apply the sign-in result unless this call was forced by
			// the caller (for example, the OAuth redirect flow uses force=true).
			if (current === false && !force) {
				return undefined;
			}

			if (data === undefined) {
				// Debug: no data parsed
				console.debug(
					"[ensureSignedIn] parsed no userSessionData from payload",
				);
			} else {
				// Debug: indicate we're about to apply sign-in
				console.debug(
					"[ensureSignedIn] applying signIn, user=",
					data.user?.user_id ?? "<unknown>",
				);
				const signInFn = storeApi.getState().signIn;
				const setIsSignedInFn = storeApi.getState().setIsSignedIn;
				try {
					signInFn?.(data);
					setIsSignedInFn?.(true);
				} catch (err) {
					console.error("apply signIn failed:", err);
				}
			}

			return data;
		} catch (err) {
			console.error("post-process ensureSignedIn error", err);
			return data;
		}
	})();

	return globalInFlight;
}

export default function useEnsureSignedIn(options?: { force?: boolean }): void {
	const force = options?.force ?? false;
	const storeApiRef = useRef<StoreApi<AppSlice> | undefined>(undefined);

	useEffect(() => {
		if (!storeApiRef.current) {
			storeApiRef.current = getStoreApi();
		}
		console.debug("[useEnsureSignedIn] effect mounted, force=", force);
		void ensureSignedIn({ force });
	}, [force]);
}
