/* eslint-disable @typescript-eslint/require-await, promise/prefer-await-to-then, @typescript-eslint/no-unsafe-type-assertion */

import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import savePlaylist from "./savePlaylist";
import makeGetStub from "./test-utils/makeGetStub";

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
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve("server err"),
			} as unknown as Response),
		);

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Failed to save playlist/);
	});

	it("throws PlaylistSaveInvalidResponseError on parse failure", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.reject(new Error("bad json")),
			} as unknown),
		);

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("throws PlaylistSaveInvalidResponseError when response missing playlist_id", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ data: {} }),
			} as unknown),
		);

		const eff = savePlaylist(sampleRequest, makeGetStub());
		const promise = Effect.runPromise(eff);

		await expect(promise).rejects.toThrow(/Invalid response/);
	});

	it("returns playlist_id on success", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ data: { playlist_id: "abc-123" } }),
			} as unknown as Response),
		);

		const get = makeGetStub();
		const eff = savePlaylist(sampleRequest, get);

		await expect(Effect.runPromise(eff)).resolves.toBe("abc-123");

		expect(get().setPlaylistSaving).toHaveBeenCalledWith(true);
		expect(get().setPlaylistSaving).toHaveBeenCalledWith(false);
	});
});
