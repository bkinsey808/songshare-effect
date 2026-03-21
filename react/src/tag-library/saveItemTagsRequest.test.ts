import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import { mockExtractErrorMessage } from "@/react/lib/test-utils/mockExtractErrorMessage";
import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import saveItemTagsEffect from "./saveItemTagsRequest";

const TWO_CALLS = 2;

const BASE_PARAMS = {
	itemType: "song" as const,
	itemId: "item-1",
	originalTags: [],
	nextTags: [],
};

describe("saveItemTagsEffect", () => {
	it("resolves with void when there are no tag changes", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn());

		await expect(Effect.runPromise(saveItemTagsEffect(BASE_PARAMS))).resolves.toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("calls add endpoint for new tags", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(
			saveItemTagsEffect({
				...BASE_PARAMS,
				originalTags: [],
				nextTags: ["rock", "pop"],
			}),
		);

		expect(fetchMock).toHaveBeenCalledTimes(TWO_CALLS);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/add-to-item",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ tag_slug: "rock", item_type: "song", item_id: "item-1" }),
			}),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/add-to-item",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ tag_slug: "pop", item_type: "song", item_id: "item-1" }),
			}),
		);
	});

	it("calls remove endpoint for removed tags", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(
			saveItemTagsEffect({
				...BASE_PARAMS,
				originalTags: ["jazz", "blues"],
				nextTags: [],
			}),
		);

		expect(fetchMock).toHaveBeenCalledTimes(TWO_CALLS);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/remove-from-item",
			expect.objectContaining({
				body: JSON.stringify({ tag_slug: "jazz", item_type: "song", item_id: "item-1" }),
			}),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/remove-from-item",
			expect.objectContaining({
				body: JSON.stringify({ tag_slug: "blues", item_type: "song", item_id: "item-1" }),
			}),
		);
	});

	it("calls add and remove endpoints together for mixed changes", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(
			saveItemTagsEffect({
				...BASE_PARAMS,
				originalTags: ["old"],
				nextTags: ["new"],
			}),
		);

		expect(fetchMock).toHaveBeenCalledTimes(TWO_CALLS);
		const tagSlugs = fetchMock.mock.calls.map((call) => {
			const [, init] = forceCast<[string, RequestInit]>(call);
			return forceCast<{ tag_slug: string }>(JSON.parse(forceCast<string>(init.body))).tag_slug;
		});
		expect(tagSlugs).toStrictEqual(expect.arrayContaining(["new", "old"]));
	});

	it("does not re-add or re-remove unchanged tags", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(
			saveItemTagsEffect({
				...BASE_PARAMS,
				originalTags: ["keep", "remove-me"],
				nextTags: ["keep", "add-me"],
			}),
		);

		expect(fetchMock).toHaveBeenCalledTimes(TWO_CALLS);
		const tagSlugs = fetchMock.mock.calls.map((call) => {
			const [, init] = forceCast<[string, RequestInit]>(call);
			return forceCast<{ tag_slug: string }>(JSON.parse(forceCast<string>(init.body))).tag_slug;
		});
		expect(tagSlugs).toContain("add-me");
		expect(tagSlugs).toContain("remove-me");
		expect(tagSlugs).not.toContain("keep");
	});

	it("fails with error message when a response is not ok", async () => {
		vi.resetAllMocks();
		mockExtractErrorMessage();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(mockFetchResponse({ error: "not found" }, { ok: false, status: 404 })),
		);

		await expect(
			Effect.runPromise(
				saveItemTagsEffect({ ...BASE_PARAMS, originalTags: [], nextTags: ["tag-a"] }),
			),
		).rejects.toThrow(/404/);
	});

	it("fails with network error when fetch rejects", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

		await expect(
			Effect.runPromise(
				saveItemTagsEffect({ ...BASE_PARAMS, originalTags: [], nextTags: ["tag-a"] }),
			),
		).rejects.toThrow(/network failure/);
	});

	it("passes itemType and itemId correctly for non-song item types", async () => {
		vi.resetAllMocks();
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({ ok: true }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(
			saveItemTagsEffect({
				itemType: "playlist",
				itemId: "playlist-99",
				originalTags: [],
				nextTags: ["ambient"],
			}),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/add-to-item",
			expect.objectContaining({
				body: JSON.stringify({
					tag_slug: "ambient",
					item_type: "playlist",
					item_id: "playlist-99",
				}),
			}),
		);
	});
});
