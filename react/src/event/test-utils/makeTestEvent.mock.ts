import type { EventEntry } from "@/react/event/event-types";

import forceCast from "@/react/lib/test-utils/forceCast";

/**
 * Test helper to construct a minimal EventEntry.
 */
export default function makeTestEvent(overrides: Partial<EventEntry> = {}): EventEntry {
	return forceCast<EventEntry>({
		event_id: "e1",
		owner_id: "u1",
		event_name: "E1",
		event_slug: "e1",
		is_public: false,
		created_at: "2026-02-07T00:00:00Z",
		updated_at: "2026-02-07T00:00:00Z",
		private_notes: "",
		participants: [],
		...overrides,
	});
}
