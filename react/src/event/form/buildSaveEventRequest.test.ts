import { describe, expect, it } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { clientLocalDateToUtcTimestamp } from "@/shared/utils/formatEventDate";

import type { EventFormValues } from "../event-types";

import buildSaveEventRequest from "./buildSaveEventRequest";

function makeFormValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
	return {
		event_id: undefined,
		event_name: "My Event",
		event_slug: "my-event",
		event_description: "",
		event_date: "",
		is_public: false,
		active_playlist_id: undefined,
		active_song_id: undefined,
		active_slide_position: undefined,
		public_notes: "",
		private_notes: "",
		...overrides,
	};
}

describe("buildSaveEventRequest", () => {
	it("builds minimal create payload with defaults", () => {
		const formValues = makeFormValues();

		const request = buildSaveEventRequest(formValues, false);

		expect(request).toStrictEqual({
			event_name: "My Event",
			event_slug: "my-event",
			is_public: false,
		});
	});

	it("includes optional fields when provided", () => {
		const eventDateInput = "2026/02/16 12:30";
		const formValues = makeFormValues({
			event_description: "Description",
			event_date: eventDateInput,
			is_public: true,
			active_playlist_id: "playlist-1",
			active_song_id: "song-1",
			active_slide_position: 1,
			public_notes: "Public note",
			private_notes: "Private note",
		});
		const expectedUtcTimestamp = clientLocalDateToUtcTimestamp(eventDateInput);

		const request = buildSaveEventRequest(formValues, false);

		expect(request).toMatchObject({
			event_name: "My Event",
			event_slug: "my-event",
			event_description: "Description",
			is_public: true,
			active_playlist_id: "playlist-1",
			active_song_id: "song-1",
			active_slide_position: 1,
			public_notes: "Public note",
			private_notes: "Private note",
		});
		expect(request.event_date).toBe(expectedUtcTimestamp);
	});

	it("includes event_id only in edit mode when present", () => {
		const formValues = makeFormValues({ event_id: "event-1" });

		const createRequest = buildSaveEventRequest(formValues, false);
		const editRequest = buildSaveEventRequest(formValues, true);

		expect(createRequest.event_id).toBeUndefined();
		expect(editRequest.event_id).toBe("event-1");
	});

	it("omits invalid event_date values", () => {
		const formValues = makeFormValues({
			event_date: forceCast<EventFormValues["event_date"]>("bad-date"),
		});

		const request = buildSaveEventRequest(formValues, false);

		expect(request.event_date).toBeUndefined();
	});
});
