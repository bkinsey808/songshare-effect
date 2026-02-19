import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import makeEventSlice from "@/react/event/slice/makeEventSlice.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import leaveEvent from "./leaveEvent";

describe("leaveEvent error cases", () => {
	it("throws EventUserLeaveNetworkError on network failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const eff = leaveEvent("e1", "u1", makeEventSlice());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Network error/);
	});

	it("throws EventUserLeaveApiError on non-ok response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));

		const eff = leaveEvent("e1", "u1", makeEventSlice());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to leave event/);
	});

	it("resolves on success and sets initial error state to undefined", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));

		const get = makeEventSlice();
		const eff = leaveEvent("e1", "u1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setEventError).toHaveBeenCalledWith(undefined);
	});

	it("refreshes active event by slug after successful leave", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));

		const get = makeEventSlice();
		const fetchEventBySlugSpy = vi.fn((_slug: string) => Effect.void);
		const currentEvent = makeEventEntry({
			event_id: "e1",
			public: forceCast({
				event_slug: "my-event",
			}),
		});

		Object.assign(get(), {
			currentEvent,
			fetchEventBySlug: fetchEventBySlugSpy,
		});

		await expect(Effect.runPromise(leaveEvent("e1", "u1", get))).resolves.toBeUndefined();
		expect(fetchEventBySlugSpy).toHaveBeenCalledWith("my-event");
	});
});
