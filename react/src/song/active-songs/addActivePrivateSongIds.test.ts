import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import makeSongSubscribeSlice from "../song-slice/makeSongSubscribeSlice.mock";

import addActivePrivateSongIds from "./addActivePrivateSongIds";

describe("addActivePrivateSongIds", () => {
	it("early-returns when no active song ids are provided and warns", async () => {
		const set = vi.fn();
		const get = makeSongSubscribeSlice();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		const effect = addActivePrivateSongIds(set, get)([]);

		// It should have updated the slice (called set twice: ids + unsubscribe)
		const EXPECTED_SET_CALLS = 2;
		const ARG_INDEX = 0;
		expect(set).toHaveBeenCalledTimes(EXPECTED_SET_CALLS);
		const hasFunctionArg = set.mock.calls.some(
			(call) => typeof (call as unknown[])[ARG_INDEX] === "function",
		);
		expect(hasFunctionArg).toBe(true);

		// Should warn synchronously
		expect(warnSpy).toHaveBeenCalledWith("[addActivePrivateSongIds] No active songs to fetch.");

		// And the returned effect should be the completed void effect
		await expect(Effect.runPromise(effect)).resolves.toBeUndefined();

		warnSpy.mockRestore();
	});
});
