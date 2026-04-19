import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import makeCurrentUser from "@/react/auth/current-user/makeCurrentUser.test-util";
import useCurrentUser from "@/react/auth/current-user/useCurrentUser";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";
import makeDeferred from "@/react/lib/test-utils/makeDeferred";
import { TEST_USER_ID } from "@/shared/test-utils/testUserConstants";
import { ChordDisplayCategory } from "@/shared/user/chord-display/chordDisplayCategory";
import { ChordLetterDisplay } from "@/shared/user/chordLetterDisplay";
import { ChordScaleDegreeDisplay } from "@/shared/user/chordScaleDegreeDisplay";
import { SlideNumberPreference } from "@/shared/user/slideNumberPreference";
import { SlideOrientationPreference } from "@/shared/user/slideOrientationPreference";

import useCurrentUserRealtimeSync from "./useCurrentUserRealtimeSync";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/current-user/useCurrentUser");
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");

const TEST_USER_TOKEN = "token-123";
const CURRENT_USER_ID_TEST_ID = "current-user-id";
const FIRST_PARAMETER_INDEX = 0;
const USER_AND_PUBLIC_SUBSCRIPTION_COUNT = 2;
const FIRST_UPDATE_CALL_INDEX = 1;
const SECOND_UPDATE_CALL_INDEX = 2;
const THIRD_UPDATE_CALL_INDEX = 3;
const FOURTH_UPDATE_CALL_INDEX = 4;
const FIFTH_UPDATE_CALL_INDEX = 5;

type StoreState = Readonly<{
	updateUserSessionUser: (update: Readonly<Record<string, string>>) => void;
	updateUserSessionUserPublic: (update: Readonly<Record<string, string>>) => void;
}>;

type SubscriptionConfig = Parameters<
	typeof createRealtimeSubscription
>[typeof FIRST_PARAMETER_INDEX];

/**
 * Configure the mocked app-store selector implementation for this file.
 *
 * @param state - Partial store state to seed into appStore.
 * @returns void
 */
function installStore(state: StoreState): void {
	vi.resetAllMocks();
	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(nextState: StoreState) => unknown>(selector)(state),
	);
}

/**
 * Returns the captured realtime subscription config for a specific table.
 *
 * @param tableName - Table name used when the subscription was created
 * @returns Matching subscription configuration
 */
function findSubscriptionConfig(tableName: SubscriptionConfig["tableName"]): SubscriptionConfig {
	const realtimeSubscriptionMock = forceCast<{
		mock: { calls: [SubscriptionConfig][] };
	}>(createRealtimeSubscription);
	const config = realtimeSubscriptionMock.mock.calls
		.map(([nextConfig]) => nextConfig)
		.find((nextConfig) => nextConfig.tableName === tableName);

	expect(config).toBeDefined();

	return forceCast<SubscriptionConfig>(config);
}

/**
 * Harness for useCurrentUserRealtimeSync.
 *
 * @returns ReactElement rendering observable hook outputs for tests
 */
function Harness(): ReactElement {
	useCurrentUserRealtimeSync();
	const currentUser = useCurrentUser();

	return <div data-testid={CURRENT_USER_ID_TEST_ID}>{currentUser?.userId ?? ""}</div>;
}

describe("useCurrentUserRealtimeSync — Harness", () => {
	it("renders signed-out UI without starting realtime subscriptions", () => {
		// Arrange
		cleanup();
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(undefined);

		// Act
		render(<Harness />);

		// Assert
		expect(screen.getByTestId(CURRENT_USER_ID_TEST_ID).textContent).toBe("");
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("mounts private and public realtime subscriptions for the signed-in user", async () => {
		// Arrange
		cleanup();
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClient>>({}),
		);
		vi.mocked(createRealtimeSubscription).mockReturnValue(vi.fn());

		// Act
		render(<Harness />);

		// Assert
		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledTimes(USER_AND_PUBLIC_SUBSCRIPTION_COUNT);
		});
		expect(screen.getByTestId(CURRENT_USER_ID_TEST_ID).textContent).toBe(TEST_USER_ID);
		expect(findSubscriptionConfig("user")).toMatchObject({
			filter: `user_id=eq.${TEST_USER_ID}`,
			tableName: "user",
		});
		expect(findSubscriptionConfig("user_public")).toMatchObject({
			filter: `user_id=eq.${TEST_USER_ID}`,
			tableName: "user_public",
		});
	});
});

describe("useCurrentUserRealtimeSync — renderHook", () => {
	it("returns early when there is no current user", () => {
		// Arrange
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(undefined);

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		// Assert
		expect(getSupabaseAuthToken).not.toHaveBeenCalled();
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("skips subscription setup when the auth token is unavailable", async () => {
		// Arrange
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(undefined);

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		// Assert
		await waitFor(() => {
			expect(getSupabaseAuthToken).toHaveBeenCalledWith();
		});
		expect(getSupabaseClient).not.toHaveBeenCalled();
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("skips subscription setup when the Supabase client cannot be created", async () => {
		// Arrange
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(undefined);

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		// Assert
		await waitFor(() => {
			expect(getSupabaseClient).toHaveBeenCalledWith(TEST_USER_TOKEN);
		});
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("updates private user preferences from user-table UPDATE payloads", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		installStore({
			updateUserSessionUser,
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClient>>({}),
		);
		vi.mocked(createRealtimeSubscription).mockReturnValue(vi.fn());

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledTimes(USER_AND_PUBLIC_SUBSCRIPTION_COUNT);
		});

		const userSubscription = findSubscriptionConfig("user");

		await act(async () => {
			await Effect.runPromise(
				userSubscription.onEvent({
					eventType: "UPDATE",
					new: {
						chord_display_category: ChordDisplayCategory.scaleDegree,
						chord_letter_display: ChordLetterDisplay.german,
						chord_scale_degree_display: ChordScaleDegreeDisplay.solfege,
						slide_number_preference: SlideNumberPreference.show,
						slide_orientation_preference: SlideOrientationPreference.landscape,
					},
				}),
			);
		});

		// Assert
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(FIRST_UPDATE_CALL_INDEX, {
			slide_orientation_preference: SlideOrientationPreference.landscape,
		});
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(SECOND_UPDATE_CALL_INDEX, {
			chord_display_category: ChordDisplayCategory.scaleDegree,
		});
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(THIRD_UPDATE_CALL_INDEX, {
			chord_letter_display: ChordLetterDisplay.german,
		});
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(FOURTH_UPDATE_CALL_INDEX, {
			chord_scale_degree_display: ChordScaleDegreeDisplay.solfege,
		});
		expect(updateUserSessionUser).toHaveBeenNthCalledWith(FIFTH_UPDATE_CALL_INDEX, {
			slide_number_preference: SlideNumberPreference.show,
		});
	});

	it("updates the public user profile from user_public UPDATE payloads", async () => {
		// Arrange
		const updateUserSessionUserPublic = vi.fn();
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic,
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClient>>({}),
		);
		vi.mocked(createRealtimeSubscription).mockReturnValue(vi.fn());

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledTimes(USER_AND_PUBLIC_SUBSCRIPTION_COUNT);
		});

		const userPublicSubscription = findSubscriptionConfig("user_public");

		await act(async () => {
			await Effect.runPromise(
				userPublicSubscription.onEvent({
					eventType: "UPDATE",
					new: {
						username: "updated-username",
					},
				}),
			);
		});

		// Assert
		expect(updateUserSessionUserPublic).toHaveBeenCalledWith({
			username: "updated-username",
		});
	});

	it("ignores invalid realtime payloads", async () => {
		// Arrange
		const updateUserSessionUser = vi.fn();
		const updateUserSessionUserPublic = vi.fn();
		installStore({
			updateUserSessionUser,
			updateUserSessionUserPublic,
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClient>>({}),
		);
		vi.mocked(createRealtimeSubscription).mockReturnValue(vi.fn());

		// Act
		renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledTimes(USER_AND_PUBLIC_SUBSCRIPTION_COUNT);
		});

		const userSubscription = findSubscriptionConfig("user");
		const userPublicSubscription = findSubscriptionConfig("user_public");

		await act(async () => {
			await Effect.runPromise(userSubscription.onEvent("not-a-record"));
			await Effect.runPromise(userPublicSubscription.onEvent({ eventType: "INSERT", new: {} }));
		});

		// Assert
		expect(updateUserSessionUser).not.toHaveBeenCalled();
		expect(updateUserSessionUserPublic).not.toHaveBeenCalled();
	});

	it("cancels async setup and skips subscriptions after unmount", async () => {
		// Arrange
		const authTokenDeferred = makeDeferred<string | undefined>();
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockReturnValue(authTokenDeferred.promise);

		// Act
		const { unmount } = renderHook(() => {
			useCurrentUserRealtimeSync();
		});
		unmount();
		authTokenDeferred.resolve(TEST_USER_TOKEN);
		await Promise.resolve();
		await Promise.resolve();

		// Assert
		expect(getSupabaseClient).not.toHaveBeenCalled();
		expect(createRealtimeSubscription).not.toHaveBeenCalled();
	});

	it("calls both realtime cleanup handlers on unmount", async () => {
		// Arrange
		const cleanupUser = vi.fn();
		const cleanupUserPublic = vi.fn();
		installStore({
			updateUserSessionUser: vi.fn(),
			updateUserSessionUserPublic: vi.fn(),
		});
		vi.mocked(useCurrentUser).mockReturnValue(
			makeCurrentUser({
				name: "Realtime User",
				userId: TEST_USER_ID,
				username: "realtime-user",
			}),
		);
		vi.mocked(getSupabaseAuthToken).mockResolvedValue(TEST_USER_TOKEN);
		vi.mocked(getSupabaseClient).mockReturnValue(
			forceCast<ReturnType<typeof getSupabaseClient>>({}),
		);
		vi.mocked(createRealtimeSubscription)
			.mockReturnValueOnce(cleanupUser)
			.mockReturnValueOnce(cleanupUserPublic);

		// Act
		const { unmount } = renderHook(() => {
			useCurrentUserRealtimeSync();
		});

		await waitFor(() => {
			expect(createRealtimeSubscription).toHaveBeenCalledTimes(USER_AND_PUBLIC_SUBSCRIPTION_COUNT);
		});

		unmount();

		// Assert
		expect(cleanupUser).toHaveBeenCalledWith();
		expect(cleanupUserPublic).toHaveBeenCalledWith();
	});
});
