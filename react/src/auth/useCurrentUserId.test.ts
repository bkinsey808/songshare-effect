import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import forceCast from "../lib/test-utils/forceCast";
import makeUserPublic from "../playlist/test-utils/makeUserPublic.mock";

const NON_STRING_ID = 999;

/**
 * A realistic user session object that tests can clone or override.
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
 * Return a copy of the sample user session where the `user_id` is not a
 * string. This is used to verify the hook gracefully rejects bad types.
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
 * Configure the mocked application store to return a state that optionally
 * includes the given `UserSessionData`.
 */
async function setGetTypedStateUser(userSessionData?: UserSessionData): Promise<void> {
	vi.resetModules();
	const appStoreModule = await import("@/react/app-store/useAppStore");
	const newState =
		userSessionData === undefined ? { userSessionData: undefined } : { userSessionData };
	// @ts-expect-error return type intentionally broad for test
	// the exact shape is irrelevant for tests
	vi.spyOn(appStoreModule, "getTypedState").mockReturnValue(newState as unknown);
}
describe("useCurrentUserId", () => {
	it("returns the current user id when a user is signed in", async () => {
		await setGetTypedStateUser({
			...SAMPLE_USER_SESSION,
			user: { ...SAMPLE_USER_SESSION.user, user_id: "user-123" },
		});

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBe("user-123");
	});

	it("returns undefined when there is no user session", async () => {
		await setGetTypedStateUser(undefined);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});

	it("returns undefined when the user_id is not a string", async () => {
		const sample = makeSampleWithNonStringId();
		await setGetTypedStateUser(sample);

		const { default: useCurrentUserId } = await import("./useCurrentUserId");
		expect(useCurrentUserId()).toBeUndefined();
	});
});
