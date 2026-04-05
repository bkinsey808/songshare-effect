import { describe, expect, it } from "vitest";

import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";

import makeUserSessionData from "./makeUserSessionData.test-util";

describe("makeUserSessionData", () => {
	it("fills in complete user and user_public defaults", () => {
		const session = makeUserSessionData();

		expect({
			chordDisplayCategory: session.user.chord_display_category,
			chordLetterDisplay: session.user.chord_letter_display,
			chordScaleDegreeDisplay: session.user.chord_scale_degree_display,
			ip: session.ip,
			oauthEmail: session.oauthUserData.email,
			slideOrientationPreference: session.user.slide_orientation_preference,
			userPublicUserId: session.userPublic.user_id,
		}).toStrictEqual({
			chordDisplayCategory: "scale_degree",
			chordLetterDisplay: "standard",
			chordScaleDegreeDisplay: "roman",
			ip: "127.0.0.1",
			oauthEmail: session.user.email,
			slideOrientationPreference: "system",
			userPublicUserId: session.user.user_id,
		});
	});

	it("applies nested overrides while preserving defaults", () => {
		const session = makeUserSessionData({
			user: { name: "Custom User" },
			userPublic: { username: "customuser" },
		});

		expect({
			chordDisplayCategory: session.user.chord_display_category,
			chordLetterDisplay: session.user.chord_letter_display,
			chordScaleDegreeDisplay: session.user.chord_scale_degree_display,
			name: session.user.name,
			slideOrientationPreference: session.user.slide_orientation_preference,
			userId: session.user.user_id,
			userPublic: session.userPublic,
		}).toStrictEqual({
			chordDisplayCategory: "scale_degree",
			chordLetterDisplay: "standard",
			chordScaleDegreeDisplay: "roman",
			name: "Custom User",
			slideOrientationPreference: "system",
			userId: TEST_USER_ID,
			userPublic: {
				user_id: TEST_USER_ID,
				username: "customuser",
			},
		});
	});
});
