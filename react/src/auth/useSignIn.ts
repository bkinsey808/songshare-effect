import { useEffect, useState } from "react";

import {
	clearSigninPending,
	isSigninPending,
} from "@/react/auth/signinPending";
import useSignInError from "@/react/auth/useSignInError";
import { getStoreApi } from "@/react/zustand/useAppStore";

type UseSignInReturn = {
	isSignedIn: boolean | undefined;
	signinPending: boolean;
	// translation key for the sign-in error (e.g. 'errors.signin.providerMismatch')
	signinError: string | undefined;
	provider: string | undefined;
	dismissError: () => void;
};

// Runtime debug flag (set in DevTools: window.__SONGSHARE_DEBUG__ = true)
const runtimeSongshareDebug = Boolean(
	typeof globalThis !== "undefined" &&
		(globalThis as unknown as Record<string, unknown>)[
			"__SONGSHARE_DEBUG__"
		] === true,
);

export default function useSignIn(): UseSignInReturn {
	const { signinError, provider, dismissError } = useSignInError();

	const getPending = (): boolean => {
		try {
			return isSigninPending();
		} catch {
			return false;
		}
	};

	const [signinPending, setSigninPending] = useState<boolean>(getPending);

	const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(
		() => getStoreApi()?.getState().isSignedIn,
	);

	useEffect(() => {
		const api = getStoreApi();
		if (!api) {
			return;
		}
		const unsubscribe = api.subscribe((state) => {
			setIsSignedIn(state.isSignedIn);
			if (runtimeSongshareDebug) {
				// eslint-disable-next-line no-console
				console.log("[songshare-debug] store isSignedIn changed", {
					t: performance.now(),
					isSignedIn: state.isSignedIn,
				});
			}
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		let timeout: number | undefined;

		if (isSignedIn === true && signinPending) {
			setTimeout(() => {
				setSigninPending(false);
				try {
					clearSigninPending();
				} catch {
					// ignore
				}
			}, 0);
			if (runtimeSongshareDebug) {
				// eslint-disable-next-line no-console
				console.log(
					"[songshare-debug] isSignedIn true, clearing local signinPending",
					{
						t: performance.now(),
					},
				);
			}
		}

		if (signinError !== undefined && signinPending) {
			setTimeout(() => {
				setSigninPending(false);
				try {
					clearSigninPending();
				} catch {
					// ignore
				}
			}, 0);
		}

		if (signinPending) {
			timeout = window.setTimeout(() => {
				setSigninPending(false);
				try {
					clearSigninPending();
				} catch {
					// ignore
				}
			}, 1000);
			if (runtimeSongshareDebug) {
				// eslint-disable-next-line no-console
				console.log(
					"[songshare-debug] signinPending true, started fallback timeout",
					{
						t: performance.now(),
					},
				);
			}
		}

		return () => {
			if (timeout !== undefined) {
				clearTimeout(timeout);
			}
		};
	}, [isSignedIn, signinError, signinPending]);

	// When the error is dismissed by useSignInError, clear any local pending
	// state here. Use a deferred setState to avoid synchronous state updates
	// inside an effect (matches previous behavior using setTimeout(..., 0)).
	useEffect(() => {
		if (signinError === undefined && signinPending) {
			setTimeout(() => {
				setSigninPending(false);
				try {
					clearSigninPending();
				} catch {
					// ignore
				}
			}, 0);
		}
	}, [signinError, signinPending]);

	return {
		isSignedIn,
		signinPending,
		signinError,
		provider,
		dismissError,
	};
}
