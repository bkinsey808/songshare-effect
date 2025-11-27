import type { Set, Get, Api } from "@/react/zustand/slice-utils";
import type { UserSessionData } from "@/shared/userSessionData";

import { sliceResetFns } from "@/react/zustand/useAppStore";

type AuthState = {
	isSignedIn: boolean | undefined;
	userSessionData: UserSessionData | undefined;
	// One-time UI flag to show a success alert after sign-in redirect.
	showSignedInAlert: boolean;
};

export type AuthSlice = AuthState & {
	setIsSignedIn: (isSignedIn: boolean | undefined) => void;
	signIn: (userSessionData: UserSessionData) => void;
	signOut: () => void;
	setShowSignedInAlert: (value: boolean) => void;
};

const initialState: AuthState = {
	isSignedIn: undefined,
	userSessionData: undefined as UserSessionData | undefined,
	showSignedInAlert: false,
};

// Arrow-style factory is the preferred pattern for these slice creators.
// Suppress the `func-style` rule here.
export function createAuthSlice(
	set: Set<AuthSlice>,
	get: Get<AuthSlice>,
	api: Api<AuthSlice>,
): AuthSlice {
	// Silence unused param warnings for slices that don't need get/api
	void get;
	void api;
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		setIsSignedIn: (isSignedIn: boolean | undefined) => {
			if (typeof window !== "undefined") {
				console.warn("[authSlice] setIsSignedIn called with:", isSignedIn);
			}
			set({ isSignedIn });
		},
		signIn: (userSessionData: UserSessionData) => {
			set({
				isSignedIn: true,
				userSessionData,
			});
		},
		signOut: () => {
			set({
				isSignedIn: false,
				userSessionData: undefined,
			});
		},
		setShowSignedInAlert: (value: boolean) => {
			if (typeof window !== "undefined") {
				console.warn("[authSlice] setShowSignedInAlert:", value);
			}
			set({ showSignedInAlert: value });
		},
	};
}
