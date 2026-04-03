import { describe, expect, it } from "vitest";

import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import makeUserSessionData from "./makeUserSessionData.test-util";

describe("makeUserSessionData", () => {
	it("fills in complete user and user_public defaults", () => {
		const session = makeUserSessionData();

		expect(session.user.chord_display_mode).toBe("roman");
		expect(session.user.slide_orientation_preference).toBe("system");
		expect(session.userPublic.user_id).toBe(session.user.user_id);
		expect(session.oauthUserData.email).toBe(session.user.email);
		expect(session.ip).toBe("127.0.0.1");
	});

	it("applies nested overrides while preserving defaults", () => {
		const session = makeUserSessionData({
			user: { name: "Custom User" },
			userPublic: { username: "customuser" },
		});

		expect(session.user.user_id).toBe(TEST_USER_ID);
		expect(session.user.name).toBe("Custom User");
		expect(session.user.chord_display_mode).toBe("roman");
		expect(session.user.slide_orientation_preference).toBe("system");
		expect(session.userPublic).toStrictEqual({
			user_id: TEST_USER_ID,
			username: "customuser",
		});
	});
});
