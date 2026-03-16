import { describe, expect, it, vi } from "vitest";

import type { AppSlice } from "@/react/app-store/AppSlice.type";
import { getTypedState } from "@/react/app-store/useAppStore";
import type { UserSessionData } from "@/shared/userSessionData";

import forceCast from "../lib/test-utils/forceCast";
import makeUserPublic from "../playlist/test-utils/makeUserPublic.mock";

vi.mock("@/react/app-store/useAppStore");

/**
 * A non-string value used to simulate malformed `user_id` values at runtime.
 * Tests verify the hook treats this as invalid and returns `undefined`.
 */
const NON_STRING_ID = 999;

/**
 * A realistic user session fixture used by tests.
 *
 * Tests may clone or override fields from this object to simulate different
 * signed-in states without repeating the full shape each time.
 */
const SAMPLE_USER_SESSION: UserSessionData = {
	user: {
		created_at: new Date().toISOString(),
		email: "u@example.com",
		google_calendar_access: "",
		google_calendar_refresh_token: undefined,
		linked_providers: undefined,
		name: "Test User",
		role: "user",
		role_expires_at: undefined,
		sub: undefined,
		updated_at: new Date().toISOString(),
		user_id: "u1",
	},
	userPublic: forceCast(makeUserPublic({ user_id: "u1", username: "u1" })),

	oauthUserData: { email: "u@example.com" },
	oauthState: { csrf: "x", lang: "en", provider: "google" },
	ip: "127.0.0.1",
};

/**
 * Create a copy of `SAMPLE_USER_SESSION` where the `user.user_id` is a
 * non-string value. The returned object intentionally violates the
 * expected type at runtime so tests can confirm the hook handles bad data
 * safely.
 *
 * @returns a `UserSessionData`-shaped object with a non-string `user_id`
 */
function makeSampleWithNonStringId(): UserSessionData {
	// we want a runtime user_id that is not a string; the type assertion
	// below will trick TypeScript into letting us return the object.
	return {
		...SAMPLE_USER_SESSION,
		user: {
			...SAMPLE_USER_SESSION.user,
			// @ts-expect-error purposefully non-string value
			user_id: NON_STRING_ID,
		},
	};
}

/**
 * Configure the app store mock to return a test-controlled `userSessionData`.
 */
function setGetTypedStateUser(userSessionData?: UserSessionData): void {
	const newState =
		userSessionData === undefined ? { userSessionData: undefined } : { userSessionData };
	vi.mocked(getTypedState).mockReturnValue(forceCast<AppSlice>(newState));
}

describe("useCurrentUserId", () => {
	it("returns the current user id when a user is signed in", async () => {
		setGetTypedStateUser({
			...SAMPLE_USER_SESSION,
			user: { ...SAMPLE_USER_SESSION.user, user_id: "user-123" },
		});

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBe("user-123");
	});

	it("returns undefined when there is no user session", async () => {
		setGetTypedStateUser(undefined);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});

	it("returns undefined when the user_id is not a string", async () => {
		const sample = makeSampleWithNonStringId();
		setGetTypedStateUser(sample);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});
});
