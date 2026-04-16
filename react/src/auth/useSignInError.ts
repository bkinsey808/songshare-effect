import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import isSigninErrorToken from "@/shared/isSigninErrorToken";
import { providerQueryParam, signinErrorQueryParam } from "@/shared/queryParams";

type UseSignInErrorReturn = {
	// translation key for the sign-in error, e.g. 'errors.signin.providerMismatch'
	signinError: string | undefined;
	provider: string | undefined;
	dismissError: () => void;
};

/**
 * Hook that derives sign-in error and provider information from query params.
 *
 * @returns Object with a `signinError` translation key, `provider` and `dismissError` handler
 */
export default function useSignInError(): UseSignInErrorReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	// capture initial params once on first render
	/**
	 * Read the signin error token from the current search params.
	 *
	 * @returns raw signin error token or undefined
	 */
	function computeInitialToken(): string | undefined {
		return searchParams.get(signinErrorQueryParam) ?? undefined;
	}

	const initialToken = computeInitialToken();
	const [provider] = useState<string | undefined>(
		() => searchParams.get(providerQueryParam) ?? undefined,
	);

	// Map the incoming token (e.g. 'providerMismatch') to a translation key
	/**
	 * Map a signin error token (e.g. 'providerMismatch') to a translation key.
	 *
	 * @param token - raw token from query params
	 * @returns translation key or undefined when token is not recognized
	 */
	function tokenToKey(token: string | undefined): string | undefined {
		if (token === undefined) {
			return undefined;
		}
		if (isSigninErrorToken(token)) {
			return `errors.signin.${token}`;
		}
		return undefined;
	}

	const [signinError, setSigninError] = useState<string | undefined>(() =>
		tokenToKey(initialToken),
	);

	// Remove the raw signinError/provider query params when we see an
	// initial token. We include the initialToken and setSearchParams in the
	// dependency list so the effect is lint-friendly and deterministic.
	useEffect(() => {
		if (initialToken !== undefined) {
			const next = new URLSearchParams(globalThis.location.search);
			next.delete(signinErrorQueryParam);
			next.delete(providerQueryParam);
			setSearchParams(next, { replace: true });
		}
	}, [initialToken, setSearchParams]);

	/**
	 * Dismiss the current signin error and remove signin query params from the URL.
	 */
	/**
	 * Dismiss the current signin error and remove signin query params from the URL.
	 *
	 * @returns void
	 */
	function dismissError(): void {
		setSigninError(undefined);

		try {
			const next = new URLSearchParams(globalThis.location.search);
			next.delete(signinErrorQueryParam);
			next.delete(providerQueryParam);
			setSearchParams(next, { replace: true });
		} catch {
			// ignore
		}
	}

	return {
		signinError,
		provider,
		dismissError,
	};
}
