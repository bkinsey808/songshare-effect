import { type Api, type Get, type Set } from "@/react/app-store/app-store-types";
import { sliceResetFns } from "@/react/app-store/slice-reset-fns";
import fetchSupabaseUserTokenFromApi from "@/react/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi";
import { type UserSessionData } from "@/shared/userSessionData";

import type { AuthSlice, AuthState } from "./auth-slice.types";

const initialState: AuthState = {
	isSignedIn: undefined,
	userSessionData: undefined as UserSessionData | undefined,
	showSignedInAlert: false,
};

/**
 * Create the auth slice for the app store.
 *
 * @param set - Zustand `set` function
 * @param get - Zustand `get` function
 * @param api - Store API
 * @returns The `AuthSlice` implementation for the store
 */
export default function createAuthSlice(
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
			if (typeof globalThis !== "undefined") {
				console.warn("[authSlice] setIsSignedIn called with:", isSignedIn);
			}
			set({ isSignedIn });
		},
		signIn: (userSessionData: UserSessionData) => {
			set({
				isSignedIn: true,
				userSessionData,
			});

			console.warn("[authSlice] signIn called, starting token fetch...");

			void fetchSupabaseUserTokenFromApi();
		},
		signOut: () => {
			set({
				isSignedIn: false,
				userSessionData: undefined,
			});
		},
		setShowSignedInAlert: (value: boolean) => {
			if (typeof globalThis !== "undefined") {
				console.warn("[authSlice] setShowSignedInAlert:", value);
			}
			set({ showSignedInAlert: value });
		},
	};
}
