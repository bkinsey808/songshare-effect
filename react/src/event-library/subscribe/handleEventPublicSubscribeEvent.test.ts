import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import isRealtimePayload from "@/react/lib/supabase/subscription/realtime/isRealtimePayload";
import forceCast from "@/react/lib/test-utils/forceCast";

import type { EventLibraryEntry } from "../event-library-types";

import makeEventLibrarySlice from "../slice/makeEventLibrarySlice.test-util";
import handleEventPublicSubscribeEvent from "./handleEventPublicSubscribeEvent";

vi.mock("@/react/lib/supabase/subscription/realtime/isRealtimePayload");

describe("handleEventPublicSubscribeEvent", () => {
	it("does nothing for non-realtime payloads", async () => {
		vi.resetAllMocks();
		vi.mocked(isRealtimePayload).mockReturnValue(false);

		const get = makeEventLibrarySlice();
		await Effect.runPromise(handleEventPublicSubscribeEvent({ foo: "bar" }, get));

		expect(get().addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("does nothing for realtime payloads that are not UPDATE", async () => {
		vi.resetAllMocks();
		vi.mocked(isRealtimePayload).mockReturnValue(true);

		const get = makeEventLibrarySlice();
		const payload = { eventType: "INSERT", new: { event_id: "e1" } };
		await Effect.runPromise(handleEventPublicSubscribeEvent(payload, get));

		expect(get().addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("does nothing when extractNewRecord returns undefined", async () => {
		vi.resetAllMocks();
		vi.mocked(isRealtimePayload).mockReturnValue(true);

		const get = makeEventLibrarySlice();
		const payload = { eventType: "UPDATE", new: undefined } as unknown;
		await Effect.runPromise(handleEventPublicSubscribeEvent(payload, get));

		expect(get().addEventLibraryEntry).not.toHaveBeenCalled();
	});

	it("updates existing entry on UPDATE and preserves owner", async () => {
		vi.resetAllMocks();
		vi.mocked(isRealtimePayload).mockReturnValue(true);

		const existingEntry = {
			event_id: "e1",
			event_public: {
				event_id: "e1",
				event_name: "Old",
				owner: { username: "owner-123" },
			},
		};

		// create a slice with the existing entry and call the handler
		const get = makeEventLibrarySlice({ e1: forceCast<EventLibraryEntry>(existingEntry) });

		const newRecord = { event_id: "e1", event_name: "New Title", event_description: "updated" };
		const payload = { eventType: "UPDATE", new: newRecord } as unknown;

		await Effect.runPromise(handleEventPublicSubscribeEvent(payload, get));

		// assert the slice state was updated
		const updated = get().eventLibraryEntries["e1"];
		expect(updated).toBeDefined();
		expect(updated?.event_id).toBe("e1");
		expect(updated?.event_public?.event_name).toBe("New Title");
		// owner should be preserved from existing entry
		expect(updated?.event_public?.owner?.username).toBe("owner-123");
		// new fields should be present
		expect(updated?.event_public?.event_description).toBe("updated");
	});
});
