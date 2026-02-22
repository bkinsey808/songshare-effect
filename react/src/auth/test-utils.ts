import { vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

/**
 * A non-string value used to validate the hook rejects incorrect IDs.
 */
export const NON_STRING_ID = 999;

/**
 * A realistic user session object that tests can clone or override.
 */
export const SAMPLE_USER_SESSION: UserSessionData = {
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
 * Configure the mocked application store to return a state that optionally
 * includes the given `UserSessionData`.
 */
export async function setGetTypedStateUser(userSessionData?: UserSessionData): Promise<void> {
	vi.resetModules();
	const appStoreModule = await import("@/react/app-store/useAppStore");
	// oxlint-disable-next-line @typescript-eslint/consistent-type-imports
	const actual = await vi.importActual<typeof import("@/react/app-store/useAppStore")>(
		"@/react/app-store/useAppStore",
	);
	const base = actual.getTypedState();
	const newState =
		userSessionData === undefined
			? { ...base, userSessionData: undefined }
			: { ...base, userSessionData };
	vi.spyOn(appStoreModule, "getTypedState").mockReturnValue(newState);
}

/**
 * Return a copy of the sample user session where the `user_id` is not a
 * string. This is used to verify the hook gracefully rejects bad types.
 */
export function makeSampleWithNonStringId(): UserSessionData {
	// Build as `unknown` to avoid narrowing the type to `string` and trigger
	// unsafe-type rules in the linter.  The caller is responsible for casting.
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
	const sample: unknown = {
		...SAMPLE_USER_SESSION,
		user: { ...SAMPLE_USER_SESSION.user, user_id: NON_STRING_ID },
	};
	// oxlint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
	return sample as UserSessionData;
}
