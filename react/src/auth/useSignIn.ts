import { useEffect, useState } from "react";

import useAppStore from "@/react/app-store/useAppStore";
import useSignInError from "@/react/auth/useSignInError";

type UseSignInReturn = {
	isSignedIn: boolean | undefined;
	// translation key for the sign-in error (e.g. 'errors.signin.providerMismatch')
	signinError: string | undefined;
	provider: string | undefined;
	dismissError: () => void;
};

/**
 * Hook that returns sign-in state and helpers for UI components.
 *
 * @returns Object containing `isSignedIn`, `signinError`, `provider` and `dismissError`
 */
export default function useSignIn(): UseSignInReturn {
	const { signinError, provider, dismissError } = useSignInError();

	const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(
		() => useAppStore.getState().isSignedIn,
	);

	// Synchronize local isSignedIn state with the app store
	useEffect(() => {
		const api = useAppStore;
		const unsubscribe = api.subscribe((state) => {
			setIsSignedIn(state.isSignedIn);
		});
		return unsubscribe;
	}, []);

	return {
		isSignedIn,
		signinError,
		provider,
		dismissError,
	};
}
