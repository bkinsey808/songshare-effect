import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { AuthState } from "./auth-slice.types";

import makeAuthSlice from "./makeAuthSlice.mock";

describe("makeAuthSlice", () => {
	it("returns initial state when provided", () => {
		const get = makeAuthSlice({ isSignedIn: true, showSignedInAlert: true });
		const slice = get();

		expect(slice.isSignedIn).toBe(true);
		expect(slice.showSignedInAlert).toBe(true);
	});

	it("setIsSignedIn updates internal state", () => {
		const get = makeAuthSlice();
		const slice = get();

		slice.setIsSignedIn(true);
		expect(slice.isSignedIn).toBe(true);
		expect(slice.setIsSignedIn).toBeDefined();
	});

	it("signIn sets session and marks signed in", () => {
		const get = makeAuthSlice();
		const slice = get();

		const sess = forceCast<NonNullable<AuthState["userSessionData"]>>({ user: { user_id: "u1" } });
		slice.signIn(sess);
		expect(slice.userSessionData).toBe(sess);
		expect(slice.isSignedIn).toBe(true);
	});

	it("signOut clears session and marks signed out", () => {
		const get = makeAuthSlice({
			userSessionData: forceCast<AuthState["userSessionData"]>({ user: { user_id: "u1" } }),
			isSignedIn: true,
		});
		const slice = get();

		slice.signOut();
		expect(slice.userSessionData).toBeUndefined();
		expect(slice.isSignedIn).toBe(false);
	});

	it("setShowSignedInAlert updates flag", () => {
		const get = makeAuthSlice({ showSignedInAlert: false });
		const slice = get();

		slice.setShowSignedInAlert(true);
		expect(slice.showSignedInAlert).toBe(true);
	});
});
