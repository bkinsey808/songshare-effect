import { describe, expect, it } from "vitest";

import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import computeCurrentUser from "./computeCurrentUser";

const USER_EMAIL = "current-user@example.com";
const USER_NAME = "Current User";
const USER_ROLE = "admin";
const USER_ID = "user-123";
const USERNAME = "currentuser";
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
			email: USER_EMAIL,
			name: USER_NAME,
			role: USER_ROLE,
			slideOrientationPreference: SlideOrientationPreference.portrait,
			userId: USER_ID,
			username: USERNAME,
		});
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
					slide_orientation_preference: storedPreference,
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
		expect(result?.slideOrientationPreference).toBe(SlideOrientationPreference.system);
	});
});
