import type { StateCreator } from "zustand";

import { sliceResetFns } from "@/react/zustand/useAppStore";
import type { UserSessionData } from "@/shared/userSessionData";

type AuthState = {
	isSignedIn: boolean | undefined;
	userSessionData: UserSessionData | undefined;
};

export type AuthSlice = AuthState & {
	setIsSignedIn: (isSignedIn: boolean | undefined) => void;
	signIn: (userSessionData: UserSessionData) => void;
	signOut: () => void;
};

const initialState: AuthState = {
	isSignedIn: undefined,
	userSessionData: undefined as UserSessionData | undefined,
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (
	set,
) => {
	sliceResetFns.add(() => {
		set(initialState);
	});

	return {
		...initialState,
		setIsSignedIn: (isSignedIn: boolean | undefined) => {
			if (typeof window !== "undefined") {
				console.warn("[auth slice] setIsSignedIn called with:", isSignedIn);
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
	};
};
