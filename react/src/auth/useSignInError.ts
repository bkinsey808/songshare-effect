import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
	providerQueryParam,
	signinErrorQueryParam,
} from "@/shared/queryParams";
import { isSigninErrorToken } from "@/shared/signinTokens";

type UseSignInErrorReturn = {
	// translation key for the sign-in error, e.g. 'errors.signin.providerMismatch'
	signinError: string | undefined;
	provider: string | undefined;
	dismissError: () => void;
};

export default function useSignInError(): UseSignInErrorReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	// capture initial params once on first render
	function computeInitialToken(): string | undefined {
		return searchParams.get(signinErrorQueryParam) ?? undefined;
	}

	const initialToken = computeInitialToken();
	const [provider] = useState<string | undefined>(
		() => searchParams.get(providerQueryParam) ?? undefined,
	);

	// Map the incoming token (e.g. 'providerMismatch') to a translation key
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
			const next = new URLSearchParams(window.location.search);
			next.delete(signinErrorQueryParam);
			next.delete(providerQueryParam);
			setSearchParams(next, { replace: true });
		}
	}, [initialToken, setSearchParams]);

	function dismissError(): void {
		setSigninError(undefined);

		try {
			const next = new URLSearchParams(window.location.search);
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
