import { cleanup, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeUserSessionData from "@/shared/test-utils/makeUserSessionData.test-util";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordDisplayMode } from "@/shared/user/chord-display/effectiveChordDisplayMode";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";
import type { UserSessionData } from "@/shared/userSessionData";

import useCurrentUser from "./useCurrentUser";

vi.mock("@/react/app-store/useAppStore");

const USER_EMAIL = "hook-user@example.com";
const USER_NAME = "Hook User";
const USER_ROLE = "admin";
const USER_ID = "hook-user-123";
const USERNAME = "hookuser";

/**
 * Configure the mocked app store selector for `useCurrentUser` tests.
 *
 * @param userSessionData - current session data exposed from the store
 */
function installStore(userSessionData: UserSessionData | undefined): void {
	const mockState = {
		userSessionData,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: typeof mockState) => unknown>(selector)(mockState),
	);
}

/**
 * Harness for useCurrentUser.
 *
 * Shows how a component consumes the hook by rendering each exposed field and
 * a signed-in flag for the undefined state.
 */
function Harness(): ReactElement {
	const currentUser = useCurrentUser();

	return (
		<div data-testid="harness-root">
			<div data-testid="is-signed-in">{String(currentUser !== undefined)}</div>
			<div data-testid="chord-display-mode">{currentUser?.chordDisplayMode ?? ""}</div>
			<div data-testid="email">{currentUser?.email ?? ""}</div>
			<div data-testid="name">{currentUser?.name ?? ""}</div>
			<div data-testid="role">{currentUser?.role ?? ""}</div>
			<div data-testid="slide-number-preference">{currentUser?.slideNumberPreference ?? ""}</div>
			<div data-testid="slide-orientation-preference">
				{currentUser?.slideOrientationPreference ?? ""}
			</div>
			<div data-testid="user-id">{currentUser?.userId ?? ""}</div>
			<div data-testid="username">{currentUser?.username ?? ""}</div>
		</div>
	);
}

describe("useCurrentUser — Harness", () => {
	it("renders the current user fields for signed-in UI", () => {
		// Arrange
		cleanup();
		installStore(
			makeUserSessionData({
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
			}),
		);

		// Act
		const { getByTestId } = render(<Harness />);
		const renderedValues = {
			chordDisplayMode: getByTestId("chord-display-mode").textContent,
			email: getByTestId("email").textContent,
			isSignedIn: getByTestId("is-signed-in").textContent,
			name: getByTestId("name").textContent,
			role: getByTestId("role").textContent,
			slideNumberPreference: getByTestId("slide-number-preference").textContent,
			slideOrientationPreference: getByTestId("slide-orientation-preference").textContent,
			userId: getByTestId("user-id").textContent,
			username: getByTestId("username").textContent,
		};

		// Assert
		expect(renderedValues).toStrictEqual({
			chordDisplayMode: ChordDisplayMode.roman,
			email: USER_EMAIL,
			isSignedIn: "true",
			name: USER_NAME,
			role: USER_ROLE,
			slideNumberPreference: SlideNumberPreference.hide,
			slideOrientationPreference: SlideOrientationPreference.portrait,
			userId: USER_ID,
			username: USERNAME,
		});
	});
});

describe("useCurrentUser — renderHook", () => {
	it("returns undefined when the store has no user session data", () => {
		// Arrange
		installStore(undefined);

		// Act
		const { result } = renderHook(() => useCurrentUser());

		// Assert
		expect(result.current).toBeUndefined();
	});

	it("returns the computed current user from store session data", () => {
		// Arrange
		installStore(
			makeUserSessionData({
				user: {
					email: USER_EMAIL,
					name: USER_NAME,
					role: USER_ROLE,
					slide_orientation_preference: SlideOrientationPreference.landscape,
					user_id: USER_ID,
				},
				userPublic: {
					username: USERNAME,
				},
			}),
		);

		// Act
		const { result } = renderHook(() => useCurrentUser());

		// Assert
		expect(result.current).toStrictEqual({
			chordDisplayCategory: ChordDisplayCategory.scaleDegree,
			chordLetterDisplay: ChordLetterDisplay.standard,
			chordDisplayMode: ChordDisplayMode.roman,
			chordScaleDegreeDisplay: ChordScaleDegreeDisplay.roman,
			email: USER_EMAIL,
			name: USER_NAME,
			role: USER_ROLE,
			slideNumberPreference: SlideNumberPreference.hide,
			slideOrientationPreference: SlideOrientationPreference.landscape,
			userId: USER_ID,
			username: USERNAME,
		});
	});
});
