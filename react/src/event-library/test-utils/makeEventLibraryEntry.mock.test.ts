import { describe, expect, it } from "vitest";

import makeEventLibraryEntry from "./makeEventLibraryEntry.mock";

describe("makeEventLibraryEntry", () => {
	it("returns a default entry and allows overrides", () => {
		const entry = makeEventLibraryEntry();

		expect(entry.event_id).toBe("e1");

		const overridden = makeEventLibraryEntry({
			event_id: "e2",
			event_public: {
				event_id: "e2",
				owner_id: "owner-1",
				event_name: "Test Event 2",
				event_slug: "test-event-2",
				event_description: "",
				event_date: entry.created_at,
				is_public: true,
				active_playlist_id: undefined,
				active_song_id: undefined,
				active_slide_position: undefined,
				public_notes: "",
				created_at: entry.created_at,
				updated_at: entry.created_at,
				owner: { username: "bob" },
			},
		});
		expect(overridden.event_id).toBe("e2");
		expect(overridden.event_public?.owner?.username).toBe("bob");
	});
});
