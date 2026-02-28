import { describe, expect, it } from "vitest";

import mapEventInvitations from "./mapEventInvitations";

describe("mapEventInvitations", () => {
	it("maps event user data and public data correctly", () => {
		const userData = [{ event_id: "e1" }, { event_id: "e2" }];
		const publicData = [
			{ event_id: "e1", event_name: "Event One", event_slug: "event-1" },
			{ event_id: "e2", event_name: "Event Two", event_slug: "event-2" },
		];

		const result = mapEventInvitations(userData, publicData);

		expect(result).toStrictEqual([
			{
				event_id: "e1",
				event_name: "Event One",
				event_slug: "event-1",
			},
			{
				event_id: "e2",
				event_name: "Event Two",
				event_slug: "event-2",
			},
		]);
	});

	it("skips user data without corresponding public data", () => {
		const userData = [{ event_id: "e1" }, { event_id: "3" }];
		const publicData = [{ event_id: "e1", event_name: "Event One", event_slug: "event-1" }];

		const result = mapEventInvitations(userData, publicData);

		expect(result).toStrictEqual([
			{
				event_id: "e1",
				event_name: "Event One",
				event_slug: "event-1",
			},
		]);
	});

	it("handles empty arrays", () => {
		expect(mapEventInvitations([], [])).toStrictEqual([]);
	});
});
