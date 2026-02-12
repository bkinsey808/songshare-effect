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
		event: overrides.event ?? {
			event_id: "e1",
			created_at: now,
			owner_id: "owner-1",
			private_notes: "",
			updated_at: now,
			owner_username: "owner_user",
		},
		...overrides,
	});
}
