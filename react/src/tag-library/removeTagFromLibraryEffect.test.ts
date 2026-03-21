import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";
import { apiTagLibraryRemovePath } from "@/shared/paths";

import makeTagLibraryGet from "./makeTagLibraryGet.test-util";
import removeTagFromLibraryEffect from "./removeTagFromLibraryEffect";

/** Test slug for a tag library entry used across cases. */
const SLUG = "rock";

/**
 * Create a fake `TagLibrary` slice and spy for `removeTagLibraryEntry`.
 *
 * @returns get - function that returns the mocked slice
 * @returns removeTagLibraryEntry - spy function created with `vi.fn()`
 */
// Use shared test helper to create fake slice and `removeTagLibraryEntry` spy.

// Tests for `removeTagFromLibraryEffect`: network requests and store updates.
describe("removeTagFromLibraryEffect", () => {
	it("posts to the tag library remove endpoint with the slug", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ success: true }));
		vi.stubGlobal("fetch", fetchMock);
		const { get } = makeTagLibraryGet();

		await Effect.runPromise(removeTagFromLibraryEffect(get, SLUG));

		expect(fetchMock).toHaveBeenCalledWith(
			apiTagLibraryRemovePath,
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ tag_slug: SLUG }),
			}),
		);
	});

	it("calls removeTagLibraryEntry with the slug on success", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ success: true })));
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);

		await Effect.runPromise(removeTagFromLibraryEffect(get, SLUG));

		expect(removeTagLibraryEntry).toHaveBeenCalledWith(SLUG);
	});

	it("fails when the response is not ok", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				mockFetchResponse({ error: "Not found" }, { ok: false, status: 404 }),
			),
		);
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);

		await expect(Effect.runPromise(removeTagFromLibraryEffect(get, SLUG))).rejects.toThrow(/Not found/i);
		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});

	it("fails when fetch rejects", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
		const { get } = makeTagLibraryGet();

		await expect(Effect.runPromise(removeTagFromLibraryEffect(get, SLUG))).rejects.toThrow(
			/network error/,
		);
	});

	it("does not call removeTagLibraryEntry when fetch fails", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
		const { get, removeTagLibraryEntry } = makeTagLibraryGet(["removeTagLibraryEntry"]);

		await Effect.runPromise(removeTagFromLibraryEffect(get, SLUG)).catch(() => undefined);

		expect(removeTagLibraryEntry).not.toHaveBeenCalled();
	});
});
