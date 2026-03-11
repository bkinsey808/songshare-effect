import { describe, expect, it } from "vitest";

import getDefaultEventFormValues from "./getDefaultEventFormValues";

describe("getDefaultEventFormValues", () => {
	it("returns default values when eventId is undefined", () => {
		const result = getDefaultEventFormValues(undefined);
		expect(result).toStrictEqual({
			event_id: undefined,
			event_name: "",
			event_slug: "",
			event_description: "",
			event_date: "",
			is_public: false,
			active_playlist_id: undefined,
			active_song_id: undefined,
			active_slide_position: undefined,
			public_notes: "",
			private_notes: "",
		});
	});

	it("returns event_id when eventId is provided", () => {
		const EVENT_ID = "evt-123";
		const result = getDefaultEventFormValues(EVENT_ID);
		expect(result.event_id).toBe(EVENT_ID);
		expect(result.event_name).toBe("");
	});
});
