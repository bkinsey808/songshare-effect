import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import fetchSupabaseUserTokenFromApi from "@/react/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import type { UserSessionData } from "@/shared/userSessionData";

import type { AuthSlice, AuthState } from "./auth-slice.types";
import createAuthSlice from "./createAuthSlice";
import makeAuthSlice from "./makeAuthSlice.test-util";

const AUTH_PREFIX = "[authSlice]";

vi.mock("@/react/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi");

const SAMPLE_USER_SESSION: UserSessionData = makeUserSessionData({});

/**
 * Mimics a minimal zustand store for createAuthSlice tests.
 * Uses makeAuthSlice for base behavior; state is mutable for test control.
 *
 * @param initialState - Optional initial state overrides for the mock
 * @returns Mock store utilities (state, set, get, api)
 */
function makeMockStore(initialState: Partial<AuthState> = {}): {
	state: Partial<AuthState>;
	set: Set<AuthSlice>;
	get: Get<AuthSlice>;
	api: Api<AuthSlice>;
} {
	const getHelper = makeAuthSlice(initialState);

	let state: Partial<AuthState> = { ...initialState };

	/**
	 * Update the mock state with a patch or updater function.
	 *
	 * @param patchOrUpdater - Partial state or updater function applied to the mock
	 * @returns void
	 */
	function set(
		patchOrUpdater:
			| Partial<AuthState>
			| ((stateParam: AuthState & AuthSlice) => Partial<AuthState>),
	): void {
		if (typeof patchOrUpdater === "function") {
			const next = (patchOrUpdater as (stateParam: AuthState & AuthSlice) => Partial<AuthState>)(
				get(),
			);
			Object.assign(state, next);
		} else {
			Object.assign(state, patchOrUpdater);
		}
	}

	/**
	 * Return the current mock auth state used by the test helpers.
	 *
	 * @returns The composed `AuthState & AuthSlice` representing current state.
	 */
	function get(): AuthState & AuthSlice {
		const base = getHelper();
		return {
			...base,
			isSignedIn: state.isSignedIn ?? false,
			userSessionData: state.userSessionData,
			showSignedInAlert: state.showSignedInAlert ?? false,
			setIsSignedIn: (isSignedIn) => {
				state.isSignedIn = isSignedIn;
				base.setIsSignedIn(isSignedIn);
			},
			signIn: (userSessionData) => {
				state.userSessionData = userSessionData;
				state.isSignedIn = true;
				base.signIn(userSessionData);
			},
			signOut: () => {
				state.userSessionData = undefined;
				state.isSignedIn = false;
				base.signOut();
			},
			setShowSignedInAlert: (value) => {
				state.showSignedInAlert = value;
				base.setShowSignedInAlert(value);
			},
		} as AuthState & AuthSlice;
	}

	const api: Api<AuthSlice> = {
		/**
		 * Test API helper to apply a state patch or updater to the mock store.
		 *
		 * @param patchOrUpdater - Partial state or updater function applied to the mock
		 * @returns void
		 */
		setState(patchOrUpdater) {
			set(
				patchOrUpdater as
					| Partial<AuthState>
					| ((state: AuthState & AuthSlice) => Partial<AuthState>),
			);
		},
		getState: get,
		getInitialState: get,
		subscribe: () => () => undefined,
	};

	return { state, set: set as Set<AuthSlice>, get: get as Get<AuthSlice>, api };
}

describe("createAuthSlice", () => {
	it("returns initial state and key methods", () => {
		const store = makeMockStore({
			isSignedIn: undefined,
			userSessionData: undefined,
			showSignedInAlert: false,
		});
		const { set, get, api } = store;

		const slice = createAuthSlice(set, get, api);

		expect(slice.isSignedIn).toBeUndefined();
		expect(slice.userSessionData).toBeUndefined();
		expect(slice.showSignedInAlert).toBe(false);

		expect(typeof slice.signIn).toBe("function");
		expect(typeof slice.signOut).toBe("function");
	});

	it("setIsSignedIn calls set with provided value and logs", () => {
		vi.resetAllMocks();
		const store = makeMockStore({});
		const { set, get, state } = store;

		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const slice = createAuthSlice(set, get, store.api);

		slice.setIsSignedIn(true);
		expect(state.isSignedIn).toBe(true);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining(AUTH_PREFIX), expect.anything());

		slice.setIsSignedIn(undefined);
		expect(state.isSignedIn).toBeUndefined();
	});

	it("signIn sets session, starts token fetch and logs", () => {
		vi.resetAllMocks();
		const store = makeMockStore({});
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state } = store;

		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const slice = createAuthSlice(set, get, store.api);

		const user = SAMPLE_USER_SESSION;

		slice.signIn(user);

		expect(setSpy).toHaveBeenCalledWith({ isSignedIn: true, userSessionData: user });
		expect(state.isSignedIn).toBe(true);
		expect(state.userSessionData).toBe(user);

		expect(warn).toHaveBeenCalledWith(expect.stringContaining(AUTH_PREFIX));
		expect(vi.mocked(fetchSupabaseUserTokenFromApi)).toHaveBeenCalledWith();
	});

	it("signOut clears session", () => {
		vi.resetAllMocks();
		const store = makeMockStore({ isSignedIn: true, userSessionData: SAMPLE_USER_SESSION });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state } = store;

		const slice = createAuthSlice(set, get, store.api);
		slice.signOut();

		expect(setSpy).toHaveBeenCalledWith({ isSignedIn: false, userSessionData: undefined });
		expect(state.isSignedIn).toBe(false);
		expect(state.userSessionData).toBeUndefined();
	});

	it("setShowSignedInAlert updates flag and logs", () => {
		vi.resetAllMocks();
		const store = makeMockStore({ showSignedInAlert: false });
		const setSpy = vi.spyOn(store, "set");
		const { set, get, state } = store;
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const slice = createAuthSlice(set, get, store.api);
		slice.setShowSignedInAlert(true);
		expect(setSpy).toHaveBeenCalledWith({ showSignedInAlert: true });
		expect(state.showSignedInAlert).toBe(true);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining(AUTH_PREFIX), expect.anything());

		slice.setShowSignedInAlert(false);
		expect(setSpy).toHaveBeenCalledWith({ showSignedInAlert: false });
		expect(state.showSignedInAlert).toBe(false);
	});
});
