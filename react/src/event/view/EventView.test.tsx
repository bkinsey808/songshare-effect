import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { EventEntry, EventParticipant } from "@/react/event/event-entry/EventEntry.type";

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
		activeSlidePosition: undefined,
		activeSlideName: undefined,
		activeSlide: undefined,
		activeSlideDisplayFields: [],
		activeSongTotalSlides: 0,
		displayDate: event.public?.event_date,
		currentUserId: "owner-1",
		currentParticipant: undefined,
		canManageEvent: true,
		actionLoading: false,
		actionError: undefined,
		actionSuccess: undefined,
		handleJoinEvent: vi.fn(),
		handleLeaveEvent: vi.fn(),
		clearActionError: vi.fn(),
		clearActionSuccess: vi.fn(),
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
	function renderEventView(): void {
		cleanup();
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
		expect(screen.getByRole("button", { name: "Slide Manager" })).toBeTruthy();
	});

	it("shows slide manager for playlist admins even if not full manager", () => {
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

		renderEventView();
		expect(screen.getByRole("button", { name: "Slide Manager" })).toBeTruthy();
	});

	it("renders Leave Event button for participant who is not owner", () => {
		vi.mocked(useEventView).mockReturnValue(
			makeUseEventViewResult({
				isOwner: false,
				shouldShowActions: true,
				isParticipant: true,
				canLeave: true,
			}),
		);

		renderEventView();

		expect(screen.getByRole("button", { name: "Leave Event" })).toBeTruthy();
	});

	it("renders preview-only message for invited users", () => {
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

		renderEventView();

		expect(screen.getByRole("button", { name: "Join Event" })).toBeTruthy();
		expect(
			screen.getByText("Join this event to see participants, playlist, and slides."),
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: "View Slide Show" })).toBeNull();
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

		renderEventView();

		expect(screen.queryByText("user-uuid-1")).toBeNull();
		expect(screen.getByText("Unknown user")).toBeTruthy();
	});
});
