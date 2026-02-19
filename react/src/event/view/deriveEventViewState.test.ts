import { describe, expect, it, vi } from "vitest";

import type { EventEntry } from "@/react/event/event-entry/EventEntry.type";
import type { SongPublic } from "@/react/song/song-schema";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import deriveEventViewState from "./deriveEventViewState";

vi.mock(
	"@/shared/utils/formatEventDate",
	(): { utcTimestampToClientLocalDate: (date: string) => string } => ({
		utcTimestampToClientLocalDate: (date: string): string => `formatted:${date}`,
	}),
);

describe("deriveEventViewState", () => {
	it("derives participant ownership and active song display values", () => {
		const currentEvent = makeEventEntry({
			owner_id: "owner-1",
			owner_username: "dj-owner",
			participants: [
				{
					user_id: "user-2",
					event_id: "e1",
					joined_at: "2026-02-17T00:00:00Z",
					role: "participant",
				},
			],
			public: forceCast<NonNullable<EventEntry["public"]>>({
				event_name: "Event",
				event_slug: "event",
				event_description: "desc",
				public_notes: "notes",
				event_date: "2026-02-17T00:00:00Z",
				active_playlist_id: "playlist-1",
				active_song_id: "song-1",
				active_slide_position: 2,
			}),
		});

		const publicSongs = forceCast<Record<string, SongPublic>>({
			"song-1": {
				song_name: "Song Title",
				slide_order: ["slide-1", "slide-2"],
				slides: {
					"slide-1": { slide_name: "Verse 1" },
					"slide-2": { slide_name: "Chorus" },
				},
			},
		});

		const result = deriveEventViewState({
			currentEvent,
			currentUserId: "user-2",
			publicSongs,
		});

		expect(result).toMatchObject({
			ownerUsername: "dj-owner",
			isParticipant: true,
			isOwner: false,
			shouldShowActions: true,
			activeSongName: "Song Title",
			activeSlidePosition: 2,
			activeSlideName: "Chorus",
		});
		expect(result.displayDate).toBe("formatted:2026-02-17T00:00:00Z");
	});

	it("falls back to song id and hides actions for owner", () => {
		const currentEvent = makeEventEntry({
			owner_id: "owner-1",
			public: forceCast<NonNullable<EventEntry["public"]>>({
				event_name: "Event",
				event_slug: "event",
				event_description: "desc",
				public_notes: "notes",
				event_date: "2026-02-17T00:00:00Z",
				active_playlist_id: undefined,
				active_song_id: "song-unknown",
			}),
		});

		const result = deriveEventViewState({
			currentEvent,
			currentUserId: "owner-1",
			publicSongs: {},
		});

		expect(result.isOwner).toBe(true);
		expect(result.shouldShowActions).toBe(false);
		expect(result.activeSongName).toBe("song-unknown");
		expect(result.activeSlidePosition).toBeUndefined();
		expect(result.activeSlideName).toBeUndefined();
	});
});
