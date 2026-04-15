import {
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
	type RenderHookResult,
} from "@testing-library/react";
import { Effect } from "effect";
import { useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import useAppStore from "@/react/app-store/useAppStore";
import useCurrentUserId from "@/react/auth/useCurrentUserId";
import type { EventParticipant } from "@/react/event/event-entry/EventEntry.type";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";
import useCurrentLang from "@/react/lib/language/useCurrentLang";
import getSupabaseAuthToken from "@/react/lib/supabase/auth-token/getSupabaseAuthToken";
import createMinimalSupabaseClient from "@/react/lib/supabase/client/createMinimalSupabaseClient.test-util";
import getSupabaseClient from "@/react/lib/supabase/client/getSupabaseClient";
import createRealtimeSubscription from "@/react/lib/supabase/subscription/realtime/createRealtimeSubscription";
import forceCast from "@/react/lib/test-utils/forceCast";
import RouterWrapper from "@/react/lib/test-utils/RouterWrapper";
import useSlideOrientationPreference from "@/react/slide-orientation/useSlideOrientationPreference";
import useItemTagsDisplay from "@/react/tag/useItemTagsDisplay";
import { eventManagePath } from "@/shared/paths";

import useEventView from "./useEventView";

vi.mock("@/react/app-store/useAppStore");
vi.mock("@/react/auth/useCurrentUserId");
vi.mock("@/react/lib/language/useCurrentLang");
vi.mock("@/react/lib/supabase/auth-token/getSupabaseAuthToken");
vi.mock("@/react/lib/supabase/client/getSupabaseClient");
vi.mock("@/react/lib/supabase/subscription/realtime/createRealtimeSubscription");
vi.mock("@/react/slide-orientation/useSlideOrientationPreference");
vi.mock("@/react/tag/useItemTagsDisplay");

const EVENT_SLUG = "my-slug";
const ALT_EVENT_SLUG = "hover-slug";
const ROUTE_PATH = "/:lang/event/:event_slug/*";
const INITIAL_EVENT_ROUTE = `/en/event/${EVENT_SLUG}`;
const INITIAL_ALT_EVENT_ROUTE = `/en/event/${ALT_EVENT_SLUG}`;
const USER_ID = "u1";
const OWNER_ID = "owner-1";
const EVENT_ID = "e1";
const TOP_BAR_TRIGGER_Y = 20;
const NO_PARTICIPANTS = 0;
const SINGLE_CALL_COUNT = 1;
const FIRST_TAG = "featured";
const LANDSCAPE_CLASS = "mx-auto w-full max-w-5xl";
const PORTRAIT_CLASS = "mx-auto w-full max-w-xl";
const EMPTY_STRING = "";

type StoreState = {
	currentEvent: ReturnType<typeof makeEventEntry> | undefined;
	isEventLoading: boolean;
	eventError: string | undefined;
	fetchEventBySlug: (slug: string) => Effect.Effect<unknown, unknown>;
	joinEvent: (eventId: string) => Effect.Effect<void, unknown>;
	leaveEvent: (eventId: string, userId: string) => Effect.Effect<void, unknown>;
	setCurrentEvent: (event: ReturnType<typeof makeEventEntry> | undefined) => void;
	fetchPlaylistById: (playlistId: string) => Effect.Effect<unknown, unknown>;
	publicSongs: Record<string, unknown>;
	userSessionData:
		| {
				userPublic: {
					username: string;
				};
		  }
		| undefined;
};

/**
 * Reads a rendered test id and normalizes missing text content to an empty string.
 *
 * @param testId - The `data-testid` to read from the rendered Harness.
 * @returns The element text content or an empty string when unset.
 */
function getTestContent(testId: string): string {
	return screen.getByTestId(testId).textContent ?? "";
}

/**
 * Installs stable default mocks for external hook collaborators used by `useEventView`.
 *
 * @returns Nothing. The function configures mocked module return values for the current test.
 */
function installBaseMocks(): void {
	vi.mocked(useCurrentLang).mockReturnValue("en");
	vi.mocked(useSlideOrientationPreference).mockReturnValue({
		effectiveSlideOrientation: "landscape",
		isSystemSlideOrientation: true,
		slideOrientationPreference: "system",
	});
	vi.mocked(useItemTagsDisplay).mockReturnValue([FIRST_TAG]);
	vi.mocked(getSupabaseAuthToken).mockResolvedValue("token");
	vi.mocked(getSupabaseClient).mockReturnValue(createMinimalSupabaseClient());
	vi.mocked(createRealtimeSubscription).mockReturnValue(() => undefined);
}

/**
 * Creates a default event fixture and applies optional overrides for scenario-specific tests.
 *
 * @param overrides - Partial event fields to merge into the default fixture.
 * @returns A concrete event entry suitable for `useEventView` tests.
 */
function makeCurrentEvent(
	overrides: Partial<ReturnType<typeof makeEventEntry>> = {},
): ReturnType<typeof makeEventEntry> {
	return makeEventEntry({
		event_id: EVENT_ID,
		owner_id: OWNER_ID,
		public: {
			...makeEventEntry().public,
			event_id: EVENT_ID,
			owner_id: OWNER_ID,
			event_name: "Event",
			event_slug: EVENT_SLUG,
			is_public: true,
		},
		...overrides,
	});
}

/**
 * Installs a per-test `useAppStore` selector implementation with overridable state.
 *
 * @param overrides - Partial store values to merge into the default mocked store.
 * @returns The exact mock store object used by selectors in this test.
 */
/**
 * Install a mocked store for `useEventView` tests.
 *
 * @param overrides - Partial store values to override defaults.
 * @returns The seeded store state.
 */
function installStore(overrides: Partial<StoreState> = {}): StoreState {
	const store: StoreState = {
		currentEvent: makeCurrentEvent(),
		isEventLoading: false,
		eventError: undefined,
		fetchEventBySlug: vi.fn().mockReturnValue(Effect.succeed(undefined as unknown)),
		joinEvent: vi.fn().mockReturnValue(Effect.succeed(undefined)),
		leaveEvent: vi.fn().mockReturnValue(Effect.succeed(undefined)),
		setCurrentEvent: vi.fn(),
		fetchPlaylistById: vi.fn().mockReturnValue(Effect.succeed(undefined as unknown)),
		publicSongs: {},
		userSessionData: {
			userPublic: {
				username: "current-user",
			},
		},
		...overrides,
	};

	vi.mocked(useAppStore).mockImplementation((selector: unknown) =>
		forceCast<(state: StoreState) => unknown>(selector)(store),
	);

	return store;
}

/**
 * Resets mocks, installs stable collaborator mocks, and applies the per-test store state.
 *
 * @param overrides - Partial store values to merge into the default mocked store.
 * @returns The exact mock store object installed for the current test.
 */
function prepareStore(overrides: Partial<StoreState> = {}): StoreState {
	vi.resetAllMocks();
	installBaseMocks();
	return installStore(overrides);
}

/**
 * Renders `useEventView` with router context so route params and navigation behave normally.
 *
 * @param initialEntries - Initial router history entries for the hook under test.
 * @returns The Testing Library `renderHook` result for `useEventView`.
 */
function renderUseEventViewHook(
	initialEntries: string[] = [INITIAL_EVENT_ROUTE],
): RenderHookResult<ReturnType<typeof useEventView>, unknown> {
	return renderHook(() => useEventView(), {
		wrapper: ({ children }): ReactElement => (
			<RouterWrapper path={ROUTE_PATH} initialEntries={initialEntries}>
				{children}
			</RouterWrapper>
		),
	});
}

/**
 * Harness for useEventView.
 *
 * Shows how the hook integrates into routed UI:
 * - exposes selected derived values through test ids
 * - wires navigation handlers to buttons
 * - wires slide-show hover handlers to buttons
 * - wires join/leave and alert-clearing handlers to buttons
 *
 * @returns Rendered hook state and handlers wired into DOM elements for tests.
 */
function Harness(): ReactElement {
	const {
		event_slug,
		currentEvent,
		eventPublic,
		ownerUsername,
		participants,
		isEventLoading,
		eventError,
		participantStatus,
		canViewFullEvent,
		canViewSlides,
		canJoin,
		canLeave,
		isParticipant,
		isOwner,
		shouldShowActions,
		activeSongName,
		activeSlidePosition,
		activeSlideName,
		activeSlide,
		activeSlideDisplayFields,
		activeSongTotalSlides,
		displayDate,
		currentUserId,
		currentParticipant,
		canManageEvent,
		eventUrl,
		isTopBarVisible,
		slideContainerClassName,
		actionLoading,
		actionError,
		actionSuccess,
		handleJoinEvent,
		handleLeaveEvent,
		clearActionError,
		clearActionSuccess,
		navigateToEventSubpage,
		handleBackToEventClick,
		handleSlideShowMouseMove,
		handleSlideShowMouseLeave,
		tags,
	} = useEventView();
	const location = useLocation();

	return (
		<div>
			<div data-testid="event-slug">{event_slug ?? ""}</div>
			<div data-testid="current-event-id">{currentEvent?.event_id ?? ""}</div>
			<div data-testid="event-public-slug">{eventPublic?.event_slug ?? ""}</div>
			<div data-testid="owner-username">{ownerUsername ?? ""}</div>
			<div data-testid="participant-count">{String(participants?.length ?? NO_PARTICIPANTS)}</div>
			<div data-testid="is-event-loading">{String(isEventLoading)}</div>
			<div data-testid="event-error">{eventError ?? ""}</div>
			<div data-testid="participant-status">{participantStatus}</div>
			<div data-testid="can-view-full-event">{String(canViewFullEvent)}</div>
			<div data-testid="can-view-slides">{String(canViewSlides)}</div>
			<div data-testid="can-join">{String(canJoin)}</div>
			<div data-testid="can-leave">{String(canLeave)}</div>
			<div data-testid="is-participant">{String(isParticipant)}</div>
			<div data-testid="is-owner">{String(isOwner)}</div>
			<div data-testid="should-show-actions">{String(shouldShowActions)}</div>
			<div data-testid="active-song-name">{activeSongName ?? ""}</div>
			<div data-testid="active-slide-position">{String(activeSlidePosition ?? "")}</div>
			<div data-testid="active-slide-name">{activeSlideName ?? ""}</div>
			<div data-testid="active-slide-name-field">{activeSlide?.slide_name ?? ""}</div>
			<div data-testid="active-slide-display-fields">{activeSlideDisplayFields.join(",")}</div>
			<div data-testid="active-song-total-slides">{String(activeSongTotalSlides)}</div>
			<div data-testid="display-date">{displayDate ?? ""}</div>
			<div data-testid="current-user-id">{currentUserId ?? ""}</div>
			<div data-testid="current-participant-role">{currentParticipant?.role ?? ""}</div>
			<div data-testid="can-manage-event">{String(canManageEvent)}</div>
			<div data-testid="event-url">{eventUrl ?? ""}</div>
			<div data-testid="top-bar-visible">{String(isTopBarVisible)}</div>
			<div data-testid="slide-container-class">{slideContainerClassName}</div>
			<div data-testid="location-path">{location.pathname}</div>
			<div data-testid="action-loading">{String(actionLoading)}</div>
			<div data-testid="action-error">{actionError ?? ""}</div>
			<div data-testid="action-success">{actionSuccess ?? ""}</div>
			<div data-testid="tags">{tags.join(",")}</div>
			<button
				type="button"
				data-testid="navigate-manage"
				onClick={() => {
					navigateToEventSubpage(eventManagePath);
				}}
			>
				manage
			</button>
			<button type="button" data-testid="navigate-back" onClick={handleBackToEventClick}>
				back
			</button>
			<button
				type="button"
				data-testid="hover-top-bar"
				onClick={() => {
					handleSlideShowMouseMove(
						forceCast<React.MouseEvent<HTMLDivElement>>({
							clientY: TOP_BAR_TRIGGER_Y,
						}),
					);
				}}
			>
				hover
			</button>
			<button type="button" data-testid="leave-top-bar" onClick={handleSlideShowMouseLeave}>
				leave-hover
			</button>
			<button type="button" data-testid="join-event" onClick={handleJoinEvent}>
				join
			</button>
			<button type="button" data-testid="leave-event" onClick={handleLeaveEvent}>
				leave
			</button>
			<button type="button" data-testid="clear-error" onClick={clearActionError}>
				clear-error
			</button>
			<button type="button" data-testid="clear-success" onClick={clearActionSuccess}>
				clear-success
			</button>
		</div>
	);
}

/**
 * Creates a participant fixture for role-specific event view scenarios.
 *
 * @param role - The participant role to apply to the created fixture.
 * @returns A participant record associated with the default test event and user.
 */
function makeParticipant(role: EventParticipant["role"] = "participant"): EventParticipant {
	return {
		event_id: EVENT_ID,
		user_id: USER_ID,
		joined_at: "2026-02-17T00:00:00Z",
		role,
		status: "joined",
	};
}

/**
 * Renders the `useEventView` Harness with a concrete participant list and router state.
 *
 * @param participants - The participant fixtures to install in the mocked current event.
 * @param initialEntries - Initial router history entries for the harness render.
 * @returns Nothing. The function renders the Harness into the test DOM.
 */
function renderHarnessWithParticipants(
	participants: EventParticipant[],
	initialEntries: string[] = [INITIAL_EVENT_ROUTE],
): void {
	prepareStore({
		currentEvent: makeCurrentEvent({
			participants,
		}),
	});
	vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
	cleanup();
	render(
		<RouterWrapper path={ROUTE_PATH} initialEntries={initialEntries}>
			<Harness />
		</RouterWrapper>,
	);
}

describe("useEventView", () => {
	it("calls fetchEventBySlug when slug is present", async () => {
		// Arrange
		const store = prepareStore();

		// Act
		renderUseEventViewHook();

		// Assert
		await waitFor(() => {
			expect(store.fetchEventBySlug).toHaveBeenCalledWith(EVENT_SLUG);
		});
	});

	it("does not auto-join authenticated invited user", async () => {
		// Arrange
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants: [],
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);

		// Act
		renderUseEventViewHook();

		// Assert
		await waitFor(() => {
			expect(store.fetchEventBySlug).toHaveBeenCalledWith(EVENT_SLUG);
		});
		expect(store.joinEvent).not.toHaveBeenCalled();
	});

	it("does not auto-join when current user is the event owner", async () => {
		// Arrange
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants: [],
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(OWNER_ID);

		// Act
		renderUseEventViewHook();

		// Assert
		await waitFor(() => {
			expect(store.fetchEventBySlug).toHaveBeenCalledWith(EVENT_SLUG);
		});
		expect(store.joinEvent).not.toHaveBeenCalled();
	});

	it("handleJoinEvent sets success and clears loading on success", async () => {
		// Arrange
		prepareStore();
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const { result } = renderUseEventViewHook();

		// Act
		result.current.handleJoinEvent();

		// Assert
		await waitFor(() => {
			expect(result.current.actionSuccess).toBe("Successfully joined the event!");
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleJoinEvent sets error on failure", async () => {
		// Arrange
		const store = prepareStore();
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		vi.spyOn(store, "joinEvent").mockReturnValue(Effect.fail(new Error("boom")));
		const { result } = renderUseEventViewHook();

		// Act
		result.current.handleJoinEvent();

		// Assert
		await waitFor(() => {
			expect(result.current.actionError).toMatch(/boom|Failed to join event/);
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleLeaveEvent sets success and clears loading on success", async () => {
		// Arrange
		const participants: EventParticipant[] = [
			{
				event_id: EVENT_ID,
				user_id: USER_ID,
				joined_at: "2026-02-17T00:00:00Z",
				role: "participant",
				status: "joined",
			},
		];
		prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const { result } = renderUseEventViewHook();

		// Act
		result.current.handleLeaveEvent();

		// Assert
		await waitFor(() => {
			expect(result.current.actionSuccess).toBe("Successfully left the event!");
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("handleLeaveEvent sets error on failure", async () => {
		// Arrange
		const participants: EventParticipant[] = [
			{
				event_id: EVENT_ID,
				user_id: USER_ID,
				joined_at: "2026-02-17T00:00:00Z",
				role: "participant",
				status: "joined",
			},
		];
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		vi.spyOn(store, "leaveEvent").mockReturnValue(Effect.fail(new Error("leave boom")));
		const { result } = renderUseEventViewHook();

		// Act
		result.current.handleLeaveEvent();

		// Assert
		await waitFor(() => {
			expect(result.current.actionError).toMatch(/leave boom|Failed to leave event/);
			expect(result.current.actionLoading).toBe(false);
		});
	});

	it("subscribes to event_public and event_user changes", async () => {
		// Arrange
		prepareStore();

		// Act
		renderUseEventViewHook();

		// Assert
		await waitFor(() => {
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({
					tableName: "event_public",
					filter: `event_slug=eq.${EVENT_SLUG}`,
				}),
			);
			expect(vi.mocked(createRealtimeSubscription)).toHaveBeenCalledWith(
				expect.objectContaining({
					tableName: "event_user",
					filter: `event_id=eq.${EVENT_ID}`,
				}),
			);
		});
	});

	it("renderHook exposes event URL and slideshow state derived from dependencies", () => {
		// Arrange
		prepareStore({
			currentEvent: makeCurrentEvent({
				public: forceCast<NonNullable<ReturnType<typeof makeCurrentEvent>["public"]>>({
					...makeCurrentEvent().public,
					event_slug: ALT_EVENT_SLUG,
				}),
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		vi.mocked(useSlideOrientationPreference).mockReturnValue({
			effectiveSlideOrientation: "portrait",
			isSystemSlideOrientation: false,
			slideOrientationPreference: "portrait",
		});

		// Act
		const { result } = renderUseEventViewHook([INITIAL_ALT_EVENT_ROUTE]);

		// Assert
		expect(result.current.eventUrl).toContain(`/event/${ALT_EVENT_SLUG}`);
		expect(result.current.slideContainerClassName).toBe(PORTRAIT_CLASS);
		expect(result.current.isTopBarVisible).toBe(false);
		expect(result.current.tags).toStrictEqual([FIRST_TAG]);
	});

	it("renderHook returns undefined eventUrl and no-op navigation handlers when slug is missing", () => {
		// Arrange
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				public: forceCast<NonNullable<ReturnType<typeof makeCurrentEvent>["public"]>>({
					...makeCurrentEvent().public,
					event_slug: EMPTY_STRING,
				}),
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);

		// Act
		const { result } = renderUseEventViewHook([INITIAL_EVENT_ROUTE]);
		result.current.navigateToEventSubpage(eventManagePath);
		result.current.handleBackToEventClick();

		// Assert
		expect(result.current.eventUrl).toBe("https://localhost/en/event/");
		expect(store.fetchEventBySlug).toHaveBeenCalledWith(EVENT_SLUG);
	});

	it("harness documents derived state for a participant viewer", () => {
		// Arrange
		const participants = [makeParticipant()];

		// Act
		renderHarnessWithParticipants(participants);

		// Assert
		expect({
			eventSlug: getTestContent("event-slug"),
			currentEventId: getTestContent("current-event-id"),
			eventPublicSlug: getTestContent("event-public-slug"),
			ownerUsername: getTestContent("owner-username"),
			participantCount: getTestContent("participant-count"),
			isEventLoading: getTestContent("is-event-loading"),
			eventError: getTestContent("event-error"),
			participantStatus: getTestContent("participant-status"),
			canViewFullEvent: getTestContent("can-view-full-event"),
			canViewSlides: getTestContent("can-view-slides"),
			canJoin: getTestContent("can-join"),
			canLeave: getTestContent("can-leave"),
			isParticipant: getTestContent("is-participant"),
			isOwner: getTestContent("is-owner"),
			shouldShowActions: getTestContent("should-show-actions"),
			activeSongName: getTestContent("active-song-name"),
			activeSlidePosition: getTestContent("active-slide-position"),
			activeSlideName: getTestContent("active-slide-name"),
			activeSlideNameField: getTestContent("active-slide-name-field"),
			activeSlideDisplayFields: getTestContent("active-slide-display-fields"),
			activeSongTotalSlides: getTestContent("active-song-total-slides"),
			displayDate: getTestContent("display-date"),
			currentUserId: getTestContent("current-user-id"),
			currentParticipantRole: getTestContent("current-participant-role"),
			canManageEvent: getTestContent("can-manage-event"),
			slideContainerClass: getTestContent("slide-container-class"),
			actionLoading: getTestContent("action-loading"),
			tags: getTestContent("tags"),
		}).toStrictEqual({
			eventSlug: EVENT_SLUG,
			currentEventId: EVENT_ID,
			eventPublicSlug: EVENT_SLUG,
			ownerUsername: "",
			participantCount: "1",
			isEventLoading: "false",
			eventError: "",
			participantStatus: "joined",
			canViewFullEvent: "true",
			canViewSlides: "true",
			canJoin: "false",
			canLeave: "true",
			isParticipant: "true",
			isOwner: "false",
			shouldShowActions: "true",
			activeSongName: "",
			activeSlidePosition: "",
			activeSlideName: "",
			activeSlideNameField: "",
			activeSlideDisplayFields: "lyrics,script,enTranslation",
			activeSongTotalSlides: "0",
			displayDate: "",
			currentUserId: USER_ID,
			currentParticipantRole: "participant",
			canManageEvent: "false",
			slideContainerClass: LANDSCAPE_CLASS,
			actionLoading: "false",
			tags: FIRST_TAG,
		});
		expect(getTestContent("event-url")).toContain(`/event/${EVENT_SLUG}`);
	});

	it("harness updates top bar visibility on hover handlers", async () => {
		// Arrange
		const participants = [makeParticipant()];

		// Act
		renderHarnessWithParticipants(participants);
		fireEvent.click(screen.getByTestId("hover-top-bar"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("top-bar-visible").textContent).toBe("true");
		});

		// Act
		fireEvent.click(screen.getByTestId("leave-top-bar"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("top-bar-visible").textContent).toBe("false");
		});
	});

	it("harness navigates to manage and back routes", async () => {
		// Arrange
		const participants = [makeParticipant()];

		// Act
		renderHarnessWithParticipants(participants);
		fireEvent.click(screen.getByTestId("navigate-manage"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("location-path").textContent).toBe(
				`/en/event/${EVENT_SLUG}/${eventManagePath}`,
			);
		});

		// Act
		fireEvent.click(screen.getByTestId("navigate-back"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("location-path").textContent).toBe(`/en/event/${EVENT_SLUG}`);
		});
	});

	it("harness shows canManageEvent when the current participant is an event admin", () => {
		// Arrange
		const participants = [makeParticipant("event_admin")];

		// Act
		renderHarnessWithParticipants(participants);

		// Assert
		expect(getTestContent("current-participant-role")).toBe("event_admin");
		expect(getTestContent("can-manage-event")).toBe("true");
	});

	it("harness surfaces join errors through DOM", async () => {
		// Arrange
		const participants = [makeParticipant()];
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const joinEvent = vi.fn().mockReturnValue(Effect.fail(new Error("join failed")));
		store.joinEvent = joinEvent;
		cleanup();
		render(
			<RouterWrapper path={ROUTE_PATH} initialEntries={[INITIAL_EVENT_ROUTE]}>
				<Harness />
			</RouterWrapper>,
		);

		// Act
		fireEvent.click(screen.getByTestId("join-event"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("action-error").textContent).toMatch(/join failed/);
			expect(getTestContent("action-loading")).toBe("false");
		});
		expect(joinEvent).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("harness clears join errors through DOM", async () => {
		// Arrange
		const participants = [makeParticipant()];
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		vi.spyOn(store, "joinEvent").mockReturnValue(Effect.fail(new Error("join failed")));
		cleanup();
		render(
			<RouterWrapper path={ROUTE_PATH} initialEntries={[INITIAL_EVENT_ROUTE]}>
				<Harness />
			</RouterWrapper>,
		);

		// Act
		fireEvent.click(screen.getByTestId("join-event"));
		await waitFor(() => {
			expect(screen.getByTestId("action-error").textContent).toMatch(/join failed/);
		});
		fireEvent.click(screen.getByTestId("clear-error"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("action-error").textContent).toBe("");
		});
	});

	it("harness surfaces leave success through DOM", async () => {
		// Arrange
		const participants = [makeParticipant()];
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		const leaveEventSpy = vi.spyOn(store, "leaveEvent").mockReturnValue(Effect.succeed(undefined));
		cleanup();
		render(
			<RouterWrapper path={ROUTE_PATH} initialEntries={[INITIAL_EVENT_ROUTE]}>
				<Harness />
			</RouterWrapper>,
		);

		// Act
		fireEvent.click(screen.getByTestId("leave-event"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("action-success").textContent).toBe("Successfully left the event!");
		});
		expect(leaveEventSpy).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});

	it("harness clears success messages through DOM", async () => {
		// Arrange
		const participants = [makeParticipant()];
		const store = prepareStore({
			currentEvent: makeCurrentEvent({
				participants,
			}),
		});
		vi.mocked(useCurrentUserId).mockReturnValue(USER_ID);
		vi.spyOn(store, "leaveEvent").mockReturnValue(Effect.succeed(undefined));
		cleanup();
		render(
			<RouterWrapper path={ROUTE_PATH} initialEntries={[INITIAL_EVENT_ROUTE]}>
				<Harness />
			</RouterWrapper>,
		);

		// Act
		fireEvent.click(screen.getByTestId("leave-event"));
		await waitFor(() => {
			expect(screen.getByTestId("action-success").textContent).toBe("");
		});
		fireEvent.click(screen.getByTestId("clear-success"));

		// Assert
		await waitFor(() => {
			expect(screen.getByTestId("action-success").textContent).toBe("");
		});
	});
});
