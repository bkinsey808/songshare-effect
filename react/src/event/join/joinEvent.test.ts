import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeEventEntry from "@/react/event/event-entry/makeEventEntry.mock";
import makeEventSlice from "@/react/event/slice/makeEventSlice.mock";
import forceCast from "@/react/lib/test-utils/forceCast";

import joinEvent from "./joinEvent";

describe("joinEvent error cases", () => {
	it("throws EventUserJoinNetworkError on network failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const eff = joinEvent("e1", makeEventSlice());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Network error/);
	});

	it("throws EventUserJoinApiError on non-ok response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));

		const eff = joinEvent("e1", makeEventSlice());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to join event/);
	});

	it("resolves on success and sets initial error state to undefined", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));

		const get = makeEventSlice();
		const eff = joinEvent("e1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setEventError).toHaveBeenCalledWith(undefined);
	});

	it("refreshes active event by slug after successful join", async () => {
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

		await expect(Effect.runPromise(joinEvent("e1", get))).resolves.toBeUndefined();
		expect(fetchEventBySlugSpy).toHaveBeenCalledWith("my-event");
	});
});
