import { describe, expect, it } from "vitest";

import makeEventLibraryEntry from "./makeEventLibraryEntry.mock";

describe("makeEventLibraryEntry", () => {
	it("returns a default entry and allows overrides", () => {
		const entry = makeEventLibraryEntry();

		expect(entry.event_id).toBe("e1");

		const overridden = makeEventLibraryEntry({
			event_id: "e2",
			event: {
				event_id: "e2",
				created_at: entry.created_at,
				owner_id: "owner-1",
				private_notes: "",
				updated_at: entry.created_at,
				owner_username: "bob",
			},
		});
		expect(overridden.event_id).toBe("e2");
		expect(overridden.event?.owner_username).toBe("bob");
	});
});
