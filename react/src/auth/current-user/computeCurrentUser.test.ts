import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { ChordDisplayMode } from "@/shared/user/chordDisplayMode";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import computeCurrentUser from "./computeCurrentUser";

const USER_EMAIL = "current-user@example.com";
const USER_NAME = "Current User";
const USER_ROLE = "admin";
const USER_ID = "user-123";
const USERNAME = "currentuser";
const INVALID_CHORD_DISPLAY_MODE = "movable-do";
const INVALID_SLIDE_ORIENTATION_PREFERENCE = "diagonal";

describe("computeCurrentUser", () => {
	it("returns undefined when user session data is undefined", () => {
		// Act
		const result = computeCurrentUser(undefined);

		// Assert
		expect(result).toBeUndefined();
	});

	it("maps current user fields from user session data", () => {
		// Arrange
		const userSessionData = makeUserSessionData({
			user: {
				email: USER_EMAIL,
				name: USER_NAME,
				role: USER_ROLE,
				slide_orientation_preference: SlideOrientationPreference.portrait,
				user_id: USER_ID,
			},
			userPublic: {
				username: USERNAME,
			},
		});

		// Act
		const result = computeCurrentUser(userSessionData);

		// Assert
		expect(result).toStrictEqual({
			chordDisplayMode: ChordDisplayMode.roman,
			email: USER_EMAIL,
			name: USER_NAME,
			role: USER_ROLE,
			slideNumberPreference: SlideNumberPreference.hide,
			slideOrientationPreference: SlideOrientationPreference.portrait,
			userId: USER_ID,
			username: USERNAME,
		});
	});

	const chordDisplayModeCases = [
		{
			name: "keeps a stored german mode",
			storedMode: ChordDisplayMode.german,
			expectedMode: ChordDisplayMode.german,
		},
		{
			name: "falls back to roman for an invalid stored mode",
			storedMode: INVALID_CHORD_DISPLAY_MODE,
			expectedMode: ChordDisplayMode.roman,
		},
	] as const;

	it.each(chordDisplayModeCases)("coerces chordDisplayMode when it $name", ({
		expectedMode,
		storedMode,
	}) => {
		const userSessionData = makeUserSessionData({
			user: {
				chord_display_mode: forceCast<"german">(storedMode),
			},
		});

		const result = computeCurrentUser(userSessionData);

		expect(result?.chordDisplayMode).toBe(expectedMode);
	});

	const slideOrientationCases = [
		{
			name: "keeps a stored landscape preference",
			storedPreference: SlideOrientationPreference.landscape,
			expectedPreference: SlideOrientationPreference.landscape,
		},
		{
			name: "falls back to system for an invalid stored preference",
			storedPreference: INVALID_SLIDE_ORIENTATION_PREFERENCE,
			expectedPreference: SlideOrientationPreference.system,
		},
	] as const;

	it.each(slideOrientationCases)(
		"coerces slideOrientationPreference when it $name",
		({ expectedPreference, storedPreference }) => {
			// Arrange
			const userSessionData = makeUserSessionData({
				user: {
					slide_orientation_preference: forceCast<"landscape">(storedPreference),
				},
			});

			// Act
			const result = computeCurrentUser(userSessionData);

			// Assert
			expect(result?.slideOrientationPreference).toBe(expectedPreference);
		},
	);

	it("falls back to system when the stored preference is missing", () => {
		// Arrange
		const userSessionData = makeUserSessionData();

		// Act
		const result = computeCurrentUser(userSessionData);

		// Assert
		expect(result?.chordDisplayMode).toBe(ChordDisplayMode.roman);
		expect(result?.slideOrientationPreference).toBe(SlideOrientationPreference.system);
	});
});
