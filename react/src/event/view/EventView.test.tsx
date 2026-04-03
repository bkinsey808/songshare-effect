import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry, EventParticipant } from "@/react/event/event-entry/EventEntry.type";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";
import ShareButton from "@/react/lib/design-system/share-button/ShareButton";
import CollapsibleQrCode from "@/react/lib/qr-code/CollapsibleQrCode";
import forceCast from "@/react/lib/test-utils/forceCast";
import { eventManagePath, eventSlideManagerPath, eventSlideShowPath } from "@/shared/paths";
import { utcTimestampToClientLocalDate } from "@/shared/utils/date/formatEventDate";

import EventView from "./EventView";
import useEventView from "./useEventView";

vi.mock("./useEventView");
vi.mock("@/react/lib/design-system/share-button/ShareButton");
vi.mock("@/react/lib/qr-code/CollapsibleQrCode");
vi.mock("@/shared/utils/date/formatEventDate");

vi.mocked(ShareButton).mockImplementation((): ReactElement => <button type="button">Share</button>);
vi.mocked(CollapsibleQrCode).mockImplementation((): ReactElement => <div data-testid="qr-code" />);

type UseEventViewResult = ReturnType<typeof useEventView>;
const FIRST_CALL_INDEX = 1;
const SECOND_CALL_INDEX = 2;
const THIRD_CALL_INDEX = 3;
const ALERT_DISMISS_DELAY_MS = 250;
const SINGLE_CALL_COUNT = 1;

/**
 * Builds a `useEventView` fixture with defaults and optional scenario overrides.
 *
 * @param overrides - Partial hook result values to merge into the default fixture.
 * @returns A complete `useEventView`-shaped result for `EventView` tests.
 */
function makeUseEventViewResult(overrides: Partial<UseEventViewResult> = {}): UseEventViewResult {
	const ownerParticipants: EventParticipant[] = [
		{
			user_id: "owner-1",
			username: "owner_user",
			event_id: "e1",
			joined_at: "2026-02-17T00:00:00Z",
			role: "owner",
			status: "joined",
		},
	] satisfies readonly EventParticipant[];

	const event = makeEventEntry({
		owner_id: "owner-1",
		participants: ownerParticipants,
		public: forceCast<NonNullable<EventEntry["public"]>>({
			event_name: "Event",
			event_slug: "event",
			event_description: "desc",
			public_notes: "notes",
			event_date: "2026-02-17T00:00:00Z",
			active_playlist_id: undefined,
			active_song_id: undefined,
		}),
	});

	const base: UseEventViewResult = {
		event_slug: "event",
		currentEvent: event,
		eventPublic: event.public,
		ownerUsername: event.owner_username,
		participants: event.participants,
		isEventLoading: false,
		eventError: undefined,
		participantStatus: "joined",
		canViewFullEvent: true,
		canViewSlides: true,
		canJoin: false,
		canLeave: true,
		isParticipant: true,
		isOwner: true,
		shouldShowActions: false,
		activeSongName: undefined,
		activeSongKey: undefined,
		activeSlidePosition: undefined,
		activeSlideName: undefined,
		activeSlide: undefined,
		activeSlideDisplayFields: [],
		activeSongTotalSlides: 0,
		displayDate: event.public?.event_date,
		currentUserId: "owner-1",
		currentParticipant: undefined,
		canManageEvent: true,
		eventUrl: "https://example.com/en/event/event",
		navigateToEventSubpage: vi.fn(),
		isTopBarVisible: false,
		slideContainerClassName: "slide-container",
		handleBackToEventClick: vi.fn(),
		handleSlideShowMouseMove: vi.fn(),
		handleSlideShowMouseLeave: vi.fn(),
		actionLoading: false,
		actionError: undefined,
		actionSuccess: undefined,
		handleJoinEvent: vi.fn(),
		handleLeaveEvent: vi.fn(),
		clearActionError: vi.fn(),
		clearActionSuccess: vi.fn(),
		tags: [],
	};

	const result = { ...base, ...overrides } as UseEventViewResult;
	// compute derived fields that depend on participants/currentUserId
	result.currentParticipant =
		result.currentUserId === undefined
			? undefined
			: (result.participants ?? []).find(
					(participant) => participant.user_id === result.currentUserId,
				);
	result.canManageEvent = result.isOwner || result.currentParticipant?.role === "event_admin";

	return result;
}

describe("event view", () => {
	/**
	 * Installs a deterministic date formatter mock for tests that render event dates.
	 *
	 * @returns Nothing. The function configures the shared date-format mock for the current test.
	 */
	function installDateMock(): void {
		vi.mocked(utcTimestampToClientLocalDate).mockImplementation((date) => `${date}`);
	}

	/**
	 * Renders `EventView` inside a memory router using the default event route.
	 *
	 * @returns Nothing. The function mounts the event view into the test DOM.
	 */
	function renderEventView(): void {
		cleanup();
		render(
			<MemoryRouter initialEntries={["/en/event/event"]}>
				<EventView />
			</MemoryRouter>,
		);
	}

	it("does not render Leave Event button for event owner", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(makeUseEventViewResult());

		// Act
		renderEventView();

		// Assert
		expect(screen.queryByRole("button", { name: "Leave Event" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Join Event" })).toBeNull();
		expect(screen.getByRole("button", { name: "View Slide Show" })).not.toBeNull();
		expect(screen.getByRole("button", { name: "Slide Manager" })).not.toBeNull();
	});

	it("renders loading state while event is loading", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isEventLoading: true,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("Loading event...")).not.toBeNull();
		expect(screen.queryByText("Event not found")).toBeNull();
	});

	it("renders error state when event loading fails", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				eventError: "Unable to load event",
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("Unable to load event")).not.toBeNull();
		expect(screen.queryByRole("button", { name: "View Slide Show" })).toBeNull();
	});

	it("renders event content when the event error is an empty string", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				eventError: "",
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("Event")).not.toBeNull();
		expect(screen.queryByText("Event not found")).toBeNull();
	});

	it("renders event not found state when event data is missing", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: undefined,
				eventPublic: undefined,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("Event not found")).not.toBeNull();
	});

	it("passes the event URL to the QR code when a slug exists", () => {
		// Arrange
		installDateMock();
		vi.clearAllMocks();
		vi.mocked(useEventView).mockReturnValue(makeUseEventViewResult());

		// Act
		renderEventView();

		// Assert
		expect(screen.getByTestId("qr-code")).not.toBeNull();
		expect(vi.mocked(CollapsibleQrCode)).toHaveBeenCalledWith(
			expect.objectContaining({
				url: "https://example.com/en/event/event",
				label: "Event",
			}),
			undefined,
		);
	});

	it("does not render the QR code when the event slug is missing", () => {
		// Arrange
		installDateMock();
		const eventWithoutSlug = makeEventEntry({
			public: forceCast<NonNullable<EventEntry["public"]>>({
				event_name: "Event",
				event_slug: "",
				event_description: "desc",
				public_notes: "notes",
				event_date: "2026-02-17T00:00:00Z",
				active_playlist_id: undefined,
				active_song_id: undefined,
			}),
		});

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: eventWithoutSlug,
				eventPublic: eventWithoutSlug.public,
				eventUrl: undefined,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.queryByTestId("qr-code")).toBeNull();
	});

	it("shows slide manager for playlist admins even if not full manager", () => {
		// Arrange
		installDateMock();
		// makeUseEventViewResult computes currentParticipant by looking up
		// result.currentUserId in result.participants. To simulate a user who
		// is only an event_playlist_admin without broader event management
		// rights, we override both fields accordingly.
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				participants: [
					{
						user_id: "u1",
						username: "playlist_admin",
						event_id: "e1",
						joined_at: "2026-02-17T00:00:00Z",
						role: "event_playlist_admin",
						status: "joined",
					},
				] as EventParticipant[],
				currentUserId: "u1",
				isOwner: false,
				shouldShowActions: false,
				canViewFullEvent: true,
				canViewSlides: true,
				canManageEvent: false,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByRole("button", { name: "Slide Manager" })).not.toBeNull();
	});

	it("navigates to event subpages from the action buttons", () => {
		// Arrange
		installDateMock();
		vi.clearAllMocks();
		const navigateToEventSubpage = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				navigateToEventSubpage,
			}),
		);

		// Act
		renderEventView();

		fireEvent.click(screen.getByRole("button", { name: "View Slide Show" }));
		fireEvent.click(screen.getByRole("button", { name: "Manage Event" }));
		fireEvent.click(screen.getByRole("button", { name: "Slide Manager" }));

		// Assert
		expect(navigateToEventSubpage).toHaveBeenNthCalledWith(FIRST_CALL_INDEX, eventSlideShowPath);
		expect(navigateToEventSubpage).toHaveBeenNthCalledWith(SECOND_CALL_INDEX, eventManagePath);
		expect(navigateToEventSubpage).toHaveBeenNthCalledWith(THIRD_CALL_INDEX, eventSlideManagerPath);
	});

	it("renders Leave Event button for participant who is not owner", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isOwner: false,
				shouldShowActions: true,
				isParticipant: true,
				canLeave: true,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByRole("button", { name: "Leave Event" })).not.toBeNull();
	});

	it("shows a success alert and dismisses it", () => {
		// Arrange
		installDateMock();
		vi.useFakeTimers();
		const clearActionSuccess = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				actionSuccess: "Saved",
				clearActionSuccess,
			}),
		);

		// Act
		renderEventView();

		fireEvent.click(screen.getByTestId("alert-dismiss-button"));
		act(() => {
			vi.advanceTimersByTime(ALERT_DISMISS_DELAY_MS);
		});

		// Assert
		expect(screen.getByText("Saved")).not.toBeNull();
		expect(clearActionSuccess).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		vi.useRealTimers();
	});

	it("shows an error alert and dismisses it", () => {
		// Arrange
		installDateMock();
		vi.useFakeTimers();
		const clearActionError = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				actionError: "Broken",
				clearActionError,
			}),
		);

		// Act
		renderEventView();

		fireEvent.click(screen.getByTestId("alert-dismiss-button"));
		act(() => {
			vi.advanceTimersByTime(ALERT_DISMISS_DELAY_MS);
		});

		// Assert
		expect(screen.getByText("Broken")).not.toBeNull();
		expect(clearActionError).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
		vi.useRealTimers();
	});

	it("renders preview-only message for invited users", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				participantStatus: "invited",
				canViewFullEvent: false,
				canViewSlides: false,
				canJoin: true,
				canLeave: false,
				isOwner: false,
				isParticipant: false,
				shouldShowActions: true,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByRole("button", { name: "Join Event" })).not.toBeNull();
		expect(
			screen.getByText("Join this event to see participants, playlist, and slides."),
		).not.toBeNull();
		expect(screen.queryByRole("button", { name: "View Slide Show" })).toBeNull();
	});

	it("renders currently playing song name when available in publicSongs", () => {
		// Arrange
		installDateMock();
		const event = makeEventEntry({
			public: forceCast<NonNullable<EventEntry["public"]>>({
				event_name: "Event",
				event_slug: "event",
				event_description: "desc",
				public_notes: "notes",
				event_date: "2026-02-17T00:00:00Z",
				active_playlist_id: undefined,
				active_song_id: "song_1",
			}),
		});

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: event,
				eventPublic: event.public,
				activeSongName: "Amazing Grace",
				activeSlidePosition: 3,
				activeSlideName: "Bridge",
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("Amazing Grace")).not.toBeNull();
		expect(screen.getByText("3")).not.toBeNull();
		expect(screen.getByText("Bridge")).not.toBeNull();
	});

	it("renders the empty participants state when no participants are present", () => {
		// Arrange
		installDateMock();
		const eventWithoutParticipants = makeEventEntry({
			participants: [],
		});

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: eventWithoutParticipants,
				participants: [],
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("No participants yet")).not.toBeNull();
	});

	it("renders participant username in participants card", () => {
		// Arrange
		installDateMock();
		vi.mocked(useEventView).mockReturnValue(makeUseEventViewResult());

		// Act
		renderEventView();

		// Assert
		expect(screen.getByText("owner_user")).not.toBeNull();
	});

	it("does not render participant UUID when username is missing", () => {
		// Arrange
		installDateMock();
		const participants = [
			{
				user_id: "user-uuid-1",
				event_id: "e1",
				joined_at: "2026-02-17T00:00:00Z",
				role: "participant",
				status: "joined",
			},
		] satisfies readonly EventParticipant[];

		const event = makeEventEntry({
			owner_id: "owner-1",
			participants,
		});

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: event,
				participants: event.participants,
				ownerUsername: undefined,
			}),
		);

		// Act
		renderEventView();

		// Assert
		expect(screen.queryByText("user-uuid-1")).toBeNull();
		expect(screen.getByText("Unknown user")).not.toBeNull();
	});
});
