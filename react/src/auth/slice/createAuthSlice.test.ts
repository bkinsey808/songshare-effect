import { describe, expect, it, vi } from "vitest";

import type { Api, Get, Set } from "@/react/app-store/app-store-types";
import type { UserSessionData } from "@/shared/userSessionData";

import fetchSupabaseUserTokenFromApi from "@/react/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi";

import type { AuthSlice, AuthState } from "./auth-slice.types";

import createAuthSlice from "./createAuthSlice";
import makeAuthSlice from "./makeAuthSlice.mock";

const AUTH_PREFIX = "[authSlice]";

// Mock the token fetcher with an explicit typed factory
vi.mock(
	"@/react/lib/supabase/auth-token/fetchSupabaseUserTokenFromApi",
	(): { default: typeof fetchSupabaseUserTokenFromApi } => ({
		default: vi.fn(),
	}),
);

const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: "2026-01-01T00:00:00Z",
		email: "u@example.com",
		google_calendar_access: "none",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: "2026-01-01T00:00:00Z",
		user_id: "user-123",
	},
	userPublic: { user_id: "user-123", username: "testuser" },
	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

function makeMockStore(initialState: Partial<AuthState> = {}): {
	state: Partial<AuthState>;
	set: Set<AuthSlice>;
	get: Get<AuthSlice>;
	api: Api<AuthSlice>;
} {
	const getHelper = makeAuthSlice(initialState);

	let state: Partial<AuthState> = { ...initialState };

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
