import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import setActiveEventForCommunity from "./setActiveEventForCommunity";

vi.mock("@/shared/fetch/postJson");

describe("setActiveEventForCommunity", () => {
	const FIRST_CALL = 1;
	const FIRST_CALL_INDEX = 0;
	const SECOND_ARG_INDEX = 1;

	const setCommunityLoading = vi.fn();
	const setCommunityError = vi.fn();
	function get(): CommunitySlice {
		return forceCast({ setCommunityLoading, setCommunityError } as unknown);
	}

	it("sets loading and clears error on success with eventId", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockClear();
		mockPost.mockResolvedValue(undefined);

		const eff = setActiveEventForCommunity("c1", "e1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityError).toHaveBeenCalledWith(undefined);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ community_id: "c1", event_id: "e1" }),
		);
	});

	it("sends only community_id when eventId is undefined", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockClear();
		mockPost.mockResolvedValue(undefined);

		const eff = setActiveEventForCommunity("c1", undefined, get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ community_id: "c1" }),
		);
		const body = mockPost.mock.calls[FIRST_CALL_INDEX]?.[SECOND_ARG_INDEX];
		expect(body).toBeDefined();
		expect(body).toStrictEqual({ community_id: "c1" });
	});

	it("clears loading and sets error on failure", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockClear();
		mockPost.mockRejectedValue(new Error("boom"));

		const eff = setActiveEventForCommunity("c1", "e1", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow("boom");

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith("boom");
	});
});
