import type { NavigateFunction } from "react-router-dom";

import { ensureSignedIn } from "@/react/auth/ensureSignedIn";
import {
	SIGNIN_RETRY_DELAYS_MS,
	SIGNIN_DEFAULT_DELAY_MS,
} from "@/shared/constants/http";
import {
	justSignedInQueryParam,
	signinErrorQueryParam,
} from "@/shared/queryParams";
import { SigninErrorToken } from "@/shared/signinTokens";
import { safeArrayGet } from "@/shared/utils/safe";

/**
 * Handle the OAuth "just signed in" redirect flow.
 *
 * Extracted from the `ProtectedLayout` effect so the effect stays small and
 * the logic can be unit-tested or reused. This function performs a forced
 * `/api/me` refresh (so the client can observe the HttpOnly session cookie
 * the server set), writes a one-time marker to `sessionStorage` on success
 * so downstream UI can show a one-time success message, and finally
 * removes the `justSignedIn` query param and navigates with `replace`.
 *
 * @param params - Parameters object containing next, setSearchParams, and navigate
 * @param params.next - A URLSearchParams instance describing the next search params (the function will remove the `justSignedIn` param).
 * @param params.setSearchParams - Setter returned by React Router's `useSearchParams` used to update the URL.
 * @param params.navigate - React Router's `navigate` function used to perform the final replace navigation.
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
	let lastErr: unknown = undefined;

	async function tryEnsureSignedInWithRetries(): Promise<boolean> {
		for (const [i] of delays.entries()) {
			try {
				// allow awaiting inside retry loop by design
				// eslint-disable-next-line no-await-in-loop
				const data = await ensureSignedIn({ force: true });
				if (data !== undefined) {
					return true;
				}
			} catch (err) {
				lastErr = err;
				const isAbort =
					typeof err === "object" &&
					err !== null &&
					"name" in err &&
					(err as { name?: unknown }).name === "AbortError";
				if (isAbort) {
					return false;
				}
				console.error(
					`[ProtectedLayout] ensureSignedIn attempt ${i} failed`,
					err,
				);
			}

			const delay =
				safeArrayGet<number>(delays, i, SIGNIN_DEFAULT_DELAY_MS) ??
				SIGNIN_DEFAULT_DELAY_MS;
			// intentional sequential backoff — awaiting a timer here is expected
			// eslint-disable-next-line no-await-in-loop
			await new Promise<void>((resolve) => setTimeout(resolve, delay));
		}
		return false;
	}

	const succeeded = await tryEnsureSignedInWithRetries();

	if (succeeded) {
		try {
			if (typeof window !== "undefined") {
				sessionStorage.setItem(justSignedInQueryParam, "1");
				console.warn("[ProtectedLayout] wrote sessionStorage justSignedIn=1");
			}
		} catch {
			// ignore storage errors
		}
	} else {
		const isAbort =
			typeof lastErr === "object" &&
			lastErr !== null &&
			"name" in lastErr &&
			(lastErr as { name?: unknown }).name === "AbortError";
		if (!isAbort) {
			console.error(
				`[ProtectedLayout] ensureSignedIn ultimately failed`,
				lastErr,
			);
			next.set(signinErrorQueryParam, SigninErrorToken.serverError);
		}
	}

	// Cleanup the query param and navigate.
	setSearchParams(next, { replace: true });
	void navigate(
		window.location.pathname + (next.toString() ? `?${next.toString()}` : ""),
		{
			replace: true,
		},
	);
}
