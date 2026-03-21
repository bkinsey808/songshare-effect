import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import searchTagsEffect from "./searchTagsRequest";

describe("searchTagsEffect", () => {
	it("returns matching tag slugs on a successful response", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(mockFetchResponse({ tags: ["rock", "pop"] })),
		);

		const result = await Effect.runPromise(searchTagsEffect("ro"));

		expect(result).toStrictEqual(["rock", "pop"]);
	});

	it("calls fetch with the encoded query and credentials:include", async () => {
		vi.resetAllMocks();
		const fetchMock = vi
			.fn()
			.mockResolvedValue(mockFetchResponse({ tags: [] }));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(searchTagsEffect("hello world"));

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/tags/search?q=hello%20world",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("returns empty array when fetch rejects (network error)", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when response is not ok", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(mockFetchResponse({ tags: ["rock"] }, { ok: false, status: 500 })),
		);

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when JSON parse fails", async () => {
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					mockFetchResponse({}, { jsonError: new Error("invalid json") }),
				),
		);

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when response body is not a record", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse("not-a-record")));

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});

	it("returns empty array when tags field is not an array", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ tags: "rock" })));

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});

	it("filters out non-string items from tags array", async () => {
		const NON_STRING_NUMBER = 42;
		vi.resetAllMocks();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(mockFetchResponse({ tags: ["rock", NON_STRING_NUMBER, undefined, "pop", true] })),
		);

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual(["rock", "pop"]);
	});

	it("returns empty array when tags array is empty", async () => {
		vi.resetAllMocks();
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockFetchResponse({ tags: [] })));

		const result = await Effect.runPromise(searchTagsEffect("rock"));

		expect(result).toStrictEqual([]);
	});
});
