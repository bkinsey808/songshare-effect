import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import EventView from "./EventView";
import useEventView from "./useEventView";

vi.mock("./useEventView");
vi.mock(
	"@/shared/utils/formatEventDate",
	(): { utcTimestampToClientLocalDate: (date: string) => string } => ({
		utcTimestampToClientLocalDate: (date: string): string => date,
	}),
);

type UseEventViewResult = ReturnType<typeof useEventView>;

function makeUseEventViewResult(overrides: Partial<UseEventViewResult> = {}): UseEventViewResult {
	const event = makeEventEntry({
		owner_id: "owner-1",
		participants: [
			{
				user_id: "owner-1",
				username: "owner_user",
				event_id: "e1",
				joined_at: "2026-02-17T00:00:00Z",
				role: "owner",
			},
		],
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

	return {
		event_slug: "event",
		currentEvent: event,
		eventPublic: event.public,
		ownerUsername: event.owner_username,
		participants: event.participants,
		isEventLoading: false,
		eventError: undefined,
		isParticipant: true,
		isOwner: true,
		shouldShowActions: false,
		activeSongName: undefined,
		activeSlidePosition: undefined,
		activeSlideName: undefined,
		activeSlide: undefined,
		activeSlideDisplayFields: [],
		activeSongTotalSlides: 0,
		displayDate: event.public?.event_date,
		currentUserId: "owner-1",
		actionLoading: false,
		actionError: undefined,
		actionSuccess: undefined,
		handleJoinEvent: vi.fn(),
		handleLeaveEvent: vi.fn(),
		clearActionError: vi.fn(),
		clearActionSuccess: vi.fn(),
		...overrides,
	};
}

describe("event view", () => {
	function renderEventView(): void {
		render(
			<MemoryRouter initialEntries={["/en/events/event"]}>
				<EventView />
			</MemoryRouter>,
		);
	}

	it("does not render Leave Event button for event owner", () => {
		vi.mocked(useEventView).mockReturnValue(makeUseEventViewResult());

		renderEventView();

		expect(screen.queryByRole("button", { name: "Leave Event" })).toBeNull();
		expect(screen.queryByRole("button", { name: "Join Event" })).toBeNull();
		expect(screen.getByRole("button", { name: "View Slide Show" })).toBeTruthy();
	});

	it("renders Leave Event button for participant who is not owner", () => {
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isOwner: false,
				shouldShowActions: true,
				isParticipant: true,
			}),
		);

		renderEventView();

		expect(screen.getByRole("button", { name: "Leave Event" })).toBeTruthy();
	});

	it("renders currently playing song name when available in publicSongs", () => {
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

		renderEventView();

		expect(screen.getByText("Amazing Grace")).toBeTruthy();
		expect(screen.getByText("3")).toBeTruthy();
		expect(screen.getByText("Bridge")).toBeTruthy();
	});

	it("renders participant username in participants card", () => {
		vi.mocked(useEventView).mockReturnValue(makeUseEventViewResult());

		renderEventView();

		expect(screen.getAllByText("owner_user")).toBeTruthy();
	});

	it("does not render participant UUID when username is missing", () => {
		const event = makeEventEntry({
			owner_id: "owner-1",
			participants: [
				{
					user_id: "user-uuid-1",
					event_id: "e1",
					joined_at: "2026-02-17T00:00:00Z",
					role: "participant",
				},
			],
		});

		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				currentEvent: event,
				participants: event.participants,
				ownerUsername: undefined,
			}),
		);

		renderEventView();

		expect(screen.queryByText("user-uuid-1")).toBeNull();
		expect(screen.getByText("Unknown user")).toBeTruthy();
	});
});
