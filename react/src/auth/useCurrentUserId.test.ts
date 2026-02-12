import { describe, expect, it, vi } from "vitest";

import type { UserSessionData } from "@/shared/userSessionData";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserPublic from "@/react/playlist/test-utils/makeUserPublic.mock";

// Provide a hoisted typed mock so tests can set return values per-case.
const NON_STRING_ID = 999;
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

// eslint-disable-next-line jest/no-untyped-mock-factory
vi.mock("@/react/app-store/useAppStore", async () => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const actual = await vi.importActual<typeof import("@/react/app-store/useAppStore")>(
		"@/react/app-store/useAppStore",
	);
	return {
		...actual,
		getTypedState: vi.fn(),
	};
});

// Helper: set the mocked `getTypedState` to return a derived state that
// optionally includes `userSessionData`. Localizes the `importActual` typing
// rule to this small helper.
async function setGetTypedStateUser(userSessionData?: UserSessionData): Promise<void> {
	vi.resetModules();
	const { getTypedState } = await import("@/react/app-store/useAppStore");
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	const actual = await vi.importActual<typeof import("@/react/app-store/useAppStore")>(
		"@/react/app-store/useAppStore",
	);
	const base = actual.getTypedState();
	const newState =
		userSessionData === undefined
			? { ...base, userSessionData: undefined }
			: { ...base, userSessionData };
	vi.mocked(getTypedState).mockReturnValue(newState);
}

// Helper: construct a sample `UserSessionData` with a non-string `user_id`.
function makeSampleWithNonStringId(): UserSessionData {
	// Build as `unknown` to avoid narrowing the type to `string` and triggering
	// the `no-unsafe-type-assertion` rule on the inner property.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
	const sample: unknown = {
		...SAMPLE_USER_SESSION,
		user: { ...SAMPLE_USER_SESSION.user, user_id: NON_STRING_ID },
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion
	return sample as UserSessionData;
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
