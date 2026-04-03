import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";
import makeEventEntry from "@/react/event/event-entry/makeEventEntry.test-util";
import forceCast from "@/react/lib/test-utils/forceCast";
import SlideOrientationToggle from "@/react/slide-orientation/SlideOrientationToggle";
import SongViewCurrentSlide from "@/react/song/song-view/SongViewCurrentSlide";

import EventSlideShowView from "./EventSlideShowView";
import useEventView from "./useEventView";

vi.mock("./useEventView");
vi.mock("@/react/slide-orientation/SlideOrientationToggle");
vi.mock("@/react/song/song-view/SongViewCurrentSlide");

vi.mocked(SlideOrientationToggle).mockImplementation(
	(): ReactElement => <div data-testid="orientation-toggle" />,
);
vi.mocked(SongViewCurrentSlide).mockImplementation(
	(): ReactElement => <div data-testid="current-slide" />,
);

type UseEventViewResult = ReturnType<typeof useEventView>;
const SINGLE_CALL_COUNT = 1;

/**
 * Builds a `useEventView` fixture tailored for slideshow view tests.
 *
 * @param overrides - Partial hook result fields to override for a specific test scenario.
 * @returns A complete `useEventView`-shaped object for `EventSlideShowView` tests.
 */
function makeUseEventViewResult(overrides: Partial<UseEventViewResult> = {}): UseEventViewResult {
	const event = makeEventEntry({
		public: forceCast<NonNullable<EventEntry["public"]>>({
			event_name: "Event",
			event_slug: "event",
			event_description: "desc",
			public_notes: "notes",
			event_date: "2026-02-17T00:00:00Z",
			active_playlist_id: undefined,
			active_song_id: "song-1",
		}),
	});

	return {
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
		canLeave: false,
		isParticipant: true,
		isOwner: true,
		shouldShowActions: false,
		activeSongName: "Song",
		activeSongKey: undefined,
		activeSlidePosition: 1,
		activeSlideName: "Verse",
		activeSlide: {
			slide_name: "Verse",
			field_data: {
				text: "Amazing grace",
			},
		},
		activeSlideDisplayFields: ["text"],
		activeSongTotalSlides: 1,
		displayDate: event.public?.event_date,
		currentUserId: "owner-1",
		currentParticipant: undefined,
		canManageEvent: true,
		eventUrl: "https://example.com/en/event/event",
		navigateToEventSubpage: vi.fn(),
		isTopBarVisible: false,
		slideContainerClassName: "mx-auto w-full max-w-5xl",
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
		...overrides,
	} satisfies UseEventViewResult;
}

describe("event slide show view", () => {
	/**
	 * Renders `EventSlideShowView` after clearing any previous DOM from the current test.
	 *
	 * @returns Nothing. The function mounts the slideshow view into the document.
	 */
	function renderEventSlideShowView(): void {
		cleanup();
		render(<EventSlideShowView />);
	}

	it("renders loading state", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isEventLoading: true,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("Loading slide show...")).not.toBeNull();
	});

	it("renders error state", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				eventError: "Boom",
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("Boom")).not.toBeNull();
	});

	it("renders the slideshow when eventError is an empty string", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				eventError: "",
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByTestId("current-slide")).not.toBeNull();
	});

	it("renders join message when slides are not accessible", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				canViewSlides: false,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("Join this event to access the slide show.")).not.toBeNull();
	});

	it("renders no active song message when the event is missing", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: undefined,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("No active song.")).not.toBeNull();
	});

	it("renders no active song message when public event data is missing", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				eventPublic: undefined,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("No active song.")).not.toBeNull();
	});

	it("renders no active song message when slides are accessible without a song", () => {
		// Arrange
		const event = makeEventEntry({
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

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: event,
				eventPublic: event.public,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("No active song.")).not.toBeNull();
	});

	it("renders no active slide message", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				activeSlide: undefined,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByText("No active slide.")).not.toBeNull();
	});

	it("renders the top bar controls when the top bar is visible", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isTopBarVisible: true,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(screen.getByRole("button", { name: "Back to Event" })).not.toBeNull();
		expect(screen.getByTestId("orientation-toggle")).not.toBeNull();
	});

	it("applies hidden top bar classes when the top bar is not visible", () => {
		// Arrange
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isTopBarVisible: false,
			}),
		);

		// Act
		renderEventSlideShowView();

		const backToEventButton = screen.getByRole("button", { name: "Back to Event" });
		const topBar = backToEventButton.closest(".fixed");

		// Assert
		expect(topBar).not.toBeNull();
		expect(forceCast<Element>(topBar).className).toContain("-translate-y-full");
		expect(forceCast<Element>(topBar).className).toContain("pointer-events-none");
	});

	it("applies the slide container class name from the hook", () => {
		// Arrange
		const slideContainerClassName = "mx-auto w-full max-w-3xl";
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				slideContainerClassName,
			}),
		);

		// Act
		renderEventSlideShowView();

		const currentSlide = screen.getByTestId("current-slide");
		const slideContainer = currentSlide.parentElement;

		// Assert
		expect(slideContainer).not.toBeNull();
		expect(forceCast<Element>(slideContainer).className).toBe(slideContainerClassName);
	});

	it("passes the active slide props to the current slide component", () => {
		// Arrange
		const activeSlide = {
			slide_name: "Chorus",
			field_data: {
				text: "Grace flows down",
			},
		};
		const activeSlideDisplayFields = ["text"];
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				activeSlide,
				activeSlideDisplayFields,
			}),
		);

		// Act
		renderEventSlideShowView();

		// Assert
		expect(vi.mocked(SongViewCurrentSlide)).toHaveBeenCalledWith(
			expect.objectContaining({
				currentSlide: activeSlide,
				displayFields: activeSlideDisplayFields,
				totalSlides: SINGLE_CALL_COUNT,
			}),
			undefined,
		);
	});

	it("calls the mouse move handler from the slideshow root", () => {
		// Arrange
		const handleSlideShowMouseMove = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				handleSlideShowMouseMove,
			}),
		);

		// Act
		renderEventSlideShowView();

		const backToEventButton = screen.getByRole("button", { name: "Back to Event" });
		const slideShowRoot = backToEventButton.closest(".min-h-screen");
		fireEvent.mouseMove(forceCast<Element>(slideShowRoot));

		// Assert
		expect(handleSlideShowMouseMove).toHaveBeenCalledWith(
			expect.objectContaining({ type: "mousemove" }),
		);
	});

	it("calls the mouse leave handler from the slideshow root", () => {
		// Arrange
		const handleSlideShowMouseLeave = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				handleSlideShowMouseLeave,
			}),
		);

		// Act
		renderEventSlideShowView();

		const backToEventButton = screen.getByRole("button", { name: "Back to Event" });
		const slideShowRoot = backToEventButton.closest(".min-h-screen");
		fireEvent.mouseLeave(forceCast<Element>(slideShowRoot));

		// Assert
		expect(handleSlideShowMouseLeave).toHaveBeenCalledWith(
			expect.objectContaining({ type: "mouseleave" }),
		);
	});

	it("calls the back to event handler when the button is clicked", () => {
		// Arrange
		const handleBackToEventClick = vi.fn();
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				handleBackToEventClick,
			}),
		);

		// Act
		renderEventSlideShowView();

		const backToEventButton = screen.getByRole("button", { name: "Back to Event" });
		fireEvent.click(backToEventButton);

		// Assert
		expect(handleBackToEventClick).toHaveBeenCalledTimes(SINGLE_CALL_COUNT);
	});
});
