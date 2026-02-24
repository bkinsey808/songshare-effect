import { type NavigateFunction } from "react-router-dom";

import ensureSignedIn from "@/react/auth/ensure-signed-in/ensureSignedIn";
import { SIGNIN_DEFAULT_DELAY_MS, SIGNIN_RETRY_DELAYS_MS } from "@/shared/constants/http";
import {
	justSignedInQueryParam,
	signinErrorQueryParam,
	SigninErrorToken,
} from "@/shared/queryParams";
import { retryWithBackoff } from "@/shared/utils/retryWithBackoff";

/**
 * Handle the OAuth "just signed in" redirect flow.
 *
 * Extracted from the `RequireAuthBoundary` effect so the effect stays small and
 * the logic can be unit-tested or reused. This function performs a forced
 * `/api/me` refresh (so the client can observe the HttpOnly session cookie
 * the server set), writes a one-time marker to `sessionStorage` on success
 * so downstream UI can show a one-time success message, and finally
 * removes the `justSignedIn` query param and navigates with `replace`.
 *
 * @param next - A URLSearchParams instance describing the next search params (the function will remove the `justSignedIn` param).
 * @param setSearchParams - Setter returned by React Router's `useSearchParams` used to update the URL.
 * @param navigate - React Router's `navigate` function used to perform the final replace navigation.
 * @returns A promise that resolves once navigation has been triggered.
 */
export default async function handleJustSignedIn({
	next,
	setSearchParams,
	navigate,
}: {
	readonly next: URLSearchParams;
	readonly setSearchParams: (
		innerNext: URLSearchParams,
		options?: { readonly replace?: boolean },
	) => void;
	readonly navigate: NavigateFunction;
}): Promise<void> {
	// Retry the ensureSignedIn call a few times with backoff because some
	// browsers may not have attached the HttpOnly cookie by the time the
	// first forced `/api/me` call runs. This reduces flakes on the OAuth
	// redirect flow.
	const delays: number[] = SIGNIN_RETRY_DELAYS_MS;

	const { succeeded, lastError, aborted } = await retryWithBackoff(
		async () => {
			const data = await ensureSignedIn({ force: true });
			return data;
		},
		delays,
		{
			shouldAbort: (err) =>
				typeof err === "object" &&
				err !== null &&
				"name" in err &&
				(err as { name?: unknown }).name === "AbortError",
			onError: (err, attempt) => {
				console.error(`[RequireAuthBoundary] ensureSignedIn attempt ${attempt} failed`, err);
			},
			defaultDelayMs: SIGNIN_DEFAULT_DELAY_MS,
		},
	);

	if (succeeded) {
		try {
			if (typeof globalThis !== "undefined") {
				sessionStorage.setItem(justSignedInQueryParam, "1");
				console.warn("[ProtectedLayout] wrote sessionStorage justSignedIn=1");
			}
		} catch {
			// ignore storage errors
		}
	} else if (!aborted) {
		console.error(`[RequireAuthBoundary] ensureSignedIn ultimately failed`, lastError);
		next.set(signinErrorQueryParam, SigninErrorToken.serverError);
	}

	// Cleanup the query param and navigate.
	setSearchParams(next, { replace: true });
	void navigate(globalThis.location.pathname + (next.toString() ? `?${next.toString()}` : ""), {
		replace: true,
	});
}
