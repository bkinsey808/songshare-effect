import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { EventFormValues, SaveEventRequest } from "../event-types";

import createHandleFormSubmit from "./createHandleFormSubmit";

const CALLED_ONCE = 1;

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
		active_slide_id: undefined,
		public_notes: "",
		private_notes: "",
		...overrides,
	};
}

describe("createHandleFormSubmit", () => {
	it("prevents default and runs save flow on successful save", async () => {
		const formValues = makeFormValues();
		const clearInitialState = vi.fn();
		const navigateToEvent = vi.fn();
		const runSaveEvent = vi.fn(async (_request: SaveEventRequest) => {
			const eventId = await Promise.resolve("event-1");
			return eventId;
		});
		const runValidatedSubmit = vi.fn(async (onSubmitValid: () => Promise<void>) => {
			await onSubmitValid();
		});
		const preventDefault = vi.fn();

		const handleFormSubmit = createHandleFormSubmit({
			formValues,
			isEditing: false,
			runValidatedSubmit,
			runSaveEvent,
			clearInitialState,
			navigateToEvent,
		});

		await handleFormSubmit(
			forceCast<Parameters<typeof handleFormSubmit>[number]>({
				preventDefault,
			}),
		);

		expect(preventDefault).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(runValidatedSubmit).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(runSaveEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				event_name: "My Event",
				event_slug: "my-event",
				is_public: false,
			}),
		);
		expect(clearInitialState).toHaveBeenCalledTimes(CALLED_ONCE);
		expect(navigateToEvent).toHaveBeenCalledWith("my-event");
	});

	it("does not clear state or navigate when save result has empty event id", async () => {
		const formValues = makeFormValues();
		const clearInitialState = vi.fn();
		const navigateToEvent = vi.fn();
		const runSaveEvent = vi.fn(async (_request: SaveEventRequest) => {
			const eventId = await Promise.resolve("");
			return eventId;
		});
		const runValidatedSubmit = vi.fn(async (onSubmitValid: () => Promise<void>) => {
			await onSubmitValid();
		});

		const handleFormSubmit = createHandleFormSubmit({
			formValues,
			isEditing: false,
			runValidatedSubmit,
			runSaveEvent,
			clearInitialState,
			navigateToEvent,
		});

		await handleFormSubmit();

		expect(clearInitialState).not.toHaveBeenCalled();
		expect(navigateToEvent).not.toHaveBeenCalled();
	});
});
