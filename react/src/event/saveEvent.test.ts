import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeGetStub from "@/react/event/slice/test-utils/makeGetEventSliceStub.mock";
import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import type { SaveEventRequest } from "./event-types";

import saveEvent from "./saveEvent";

const sampleRequest: Readonly<SaveEventRequest> = {
	event_name: "E",
	event_slug: "e-slug",
};

describe("saveEvent error cases", () => {
	it("throws EventSaveNetworkError on network failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const eff = saveEvent(sampleRequest, makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Network error/);
	});

	it("throws EventSaveApiError on non-ok response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				mockFetchResponse("server err", {
					ok: false,
					status: 500,
				}),
			),
		);

		const eff = saveEvent(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to save event/);
	});

	it("throws EventSaveInvalidResponseError on parse failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				mockFetchResponse(undefined, {
					ok: true,
					status: 200,
					jsonError: new Error("bad json"),
				}),
			),
		);

		const eff = saveEvent(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("throws EventSaveInvalidResponseError when response missing event_id", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ data: {} })));

		const eff = saveEvent(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("returns event_id on success", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(mockFetchResponse({ data: { event_id: "abc-123" } })),
		);

		const get = makeGetStub();
		const eff = saveEvent(sampleRequest, get);

		await expect(Effect.runPromise(eff)).resolves.toBe("abc-123");

		expect(get().setEventSaving).toHaveBeenCalledWith(true);
		expect(get().setEventSaving).toHaveBeenCalledWith(false);
	});
});
