import { useEffect, useState } from "react";

import useSignInError from "@/react/auth/useSignInError";
import { getStoreApi } from "@/react/zustand/useAppStore";

type UseSignInReturn = {
	isSignedIn: boolean | undefined;
	// translation key for the sign-in error (e.g. 'errors.signin.providerMismatch')
	signinError: string | undefined;
	provider: string | undefined;
	dismissError: () => void;
};

export default function useSignIn(): UseSignInReturn {
	const { signinError, provider, dismissError } = useSignInError();

	const [isSignedIn, setIsSignedIn] = useState<boolean | undefined>(
		() => getStoreApi().getState().isSignedIn,
	);

	useEffect(() => {
		const api = getStoreApi();
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
