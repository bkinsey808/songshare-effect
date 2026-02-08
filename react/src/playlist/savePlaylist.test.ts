import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import savePlaylist from "./savePlaylist";
import makeGetStub from "./slice/makeGetPlaylistSliceStub.mock";

const sampleRequest = {
	playlist_name: "test",
	playlist_slug: "test-slug",
	playlist_public: { name: "Test" },
} as const;

describe("savePlaylist error cases", () => {
	it("throws PlaylistSaveNetworkError on network failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));

		const eff = savePlaylist(sampleRequest, makeGetStub());

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Network error/);
	});

	it("throws PlaylistSaveApiError on non-ok response", async () => {
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

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to save playlist/);
	});

	it("throws PlaylistSaveInvalidResponseError on parse failure", async () => {
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

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("throws PlaylistSaveInvalidResponseError when response missing playlist_id", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ data: {} })));

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("returns playlist_id on success", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(mockFetchResponse({ data: { playlist_id: "abc-123" } })),
		);

		const get = makeGetStub();
		const eff = savePlaylist(sampleRequest, get);

		await expect(Effect.runPromise(eff)).resolves.toBe("abc-123");

		expect(get().setPlaylistSaving).toHaveBeenCalledWith(true);
		expect(get().setPlaylistSaving).toHaveBeenCalledWith(false);
	});
});
