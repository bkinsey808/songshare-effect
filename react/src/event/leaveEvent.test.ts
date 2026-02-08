import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeGetStub from "@/react/event/slice/test-utils/makeGetEventSliceStub.mock";

import leaveEvent from "./leaveEvent";

describe("leaveEvent error cases", () => {
	it("throws EventUserLeaveNetworkError on network failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const eff = leaveEvent("e1", "u1", makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Network error/);
	});

	it("throws EventUserLeaveApiError on non-ok response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 400 })));

		const eff = leaveEvent("e1", "u1", makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to leave event/);
	});

	it("resolves on success and sets initial error state to undefined", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(undefined, { status: 200 })));

		const get = makeGetStub();
		const eff = leaveEvent("e1", "u1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();
		expect(get().setEventError).toHaveBeenCalledWith(undefined);
	});
});
