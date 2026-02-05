import fetchSupabaseUserTokenFromApi from "@/react/supabase/auth-token/fetchSupabaseUserTokenFromApi";
import { sliceResetFns } from "@/react/zustand/slice-reset-fns";
import { type Api, type Get, type Set } from "@/react/zustand/slice-utils";
import { type UserSessionData } from "@/shared/userSessionData";

type AuthState = {
	isSignedIn: boolean | undefined;
	userSessionData: UserSessionData | undefined;
	// One-time UI flag to show a success alert after sign-in redirect.
	showSignedInAlert: boolean;
};

type AuthSlice = AuthState & {
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

/**
 * Create the auth slice for the app store.
 *
 * @param set - Zustand `set` function
 * @param get - Zustand `get` function
 * @param api - Store API
 * @returns The `AuthSlice` implementation for the store
 */
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

export type { AuthSlice };
