import { vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { AuthSlice, AuthState } from "./auth-slice.types";

/**
 * Minimal, test-friendly `AuthSlice` getter. Exposes stateful behavior and
 * vi.fn spies for methods so tests can assert on side-effects and state.
 */
export default function makeAuthSlice(initial: Partial<AuthState> = {}): () => AuthSlice {
	const state: Partial<AuthState> = {
		isSignedIn: initial.isSignedIn,
		userSessionData: initial.userSessionData,
		showSignedInAlert: initial.showSignedInAlert ?? false,
	};

	const setIsSignedIn = vi.fn((isSignedIn: boolean | undefined) => {
		state.isSignedIn = isSignedIn;
	});

	const signIn = vi.fn((userSessionData: AuthState["userSessionData"] | undefined) => {
		state.userSessionData = userSessionData;
		state.isSignedIn = true;
	});

	const signOut = vi.fn(() => {
		state.userSessionData = undefined;
		state.isSignedIn = false;
	});

	const setShowSignedInAlert = vi.fn((value: boolean) => {
		state.showSignedInAlert = value;
	});

	const stub = {
		get isSignedIn(): boolean | undefined {
			return state.isSignedIn;
		},
		get userSessionData(): AuthState["userSessionData"] {
			return state.userSessionData;
		},
		get showSignedInAlert(): boolean {
			return Boolean(state.showSignedInAlert);
		},

		setIsSignedIn,
		signIn,
		signOut,
		setShowSignedInAlert,
	};

	return () => forceCast<AuthSlice>(stub);
}
