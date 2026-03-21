import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import mockFetchResponse from "@/react/lib/test-utils/mockFetchResponse";

import fetchTagEffect from "./fetchTagEffect";

describe("fetchTagEffect", () => {
	it("resolves with the Response on a successful fetch", async () => {
		const mockResponse = mockFetchResponse({ tag: "rock" });
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		const result = await Effect.runPromise(fetchTagEffect("/api/tags", { slug: "rock" }));

		expect(result).toBe(mockResponse);
	});

	it("calls fetch with POST method, JSON headers, and serialized body", async () => {
		const fetchMock = vi.fn().mockResolvedValue(mockFetchResponse({}));
		vi.stubGlobal("fetch", fetchMock);

		await Effect.runPromise(fetchTagEffect("/api/tags/get", { slug: "jazz" }));

		expect(fetchMock).toHaveBeenCalledWith("/api/tags/get", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slug: "jazz" }),
			credentials: "include",
		});
	});

	it("fails with an Error when fetch rejects", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

		await expect(
			Effect.runPromise(fetchTagEffect("/api/tags/get", { slug: "blues" })),
		).rejects.toThrow(/network failure/);
	});

	it("wraps non-Error thrown values in an Error", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue("timeout"));

		await expect(
			Effect.runPromise(fetchTagEffect("/api/tags/get", {})),
		).rejects.toThrow(/timeout/);
	});
});
