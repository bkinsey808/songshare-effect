import type { EventLibraryEntry } from "@/react/event-library/event-library-types";

import forceCast from "@/react/lib/test-utils/forceCast";

export default function makeEventLibraryEntry(
	overrides: Partial<EventLibraryEntry> = {},
): EventLibraryEntry {
	const now = new Date().toISOString();
	return forceCast<EventLibraryEntry>({
		user_id: "u1",
		event_id: "e1",
		event_owner_id: "owner-1",
		created_at: now,
		event_public: overrides.event_public ?? {
			event_id: "e1",
			owner_id: "owner-1",
			event_name: "Test Event",
			event_slug: "test-event",
			event_description: "Test event description",
			event_date: now,
			is_public: true,
			active_playlist_id: undefined,
			active_song_id: undefined,
			active_slide_position: undefined,
			public_notes: "",
			created_at: now,
			updated_at: now,
			owner: {
				username: "owner_user",
			},
		},
		...overrides,
	});
}
