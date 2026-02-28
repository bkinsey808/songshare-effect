import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import leaveCommunity from "./leaveCommunity";

vi.mock("@/shared/fetch/postJson");

describe("leaveCommunity", () => {
	const FIRST_CALL = 1;

	const setCommunityLoading = vi.fn();
	const setCommunityError = vi.fn();
	function get(): CommunitySlice {
		return forceCast({ setCommunityLoading, setCommunityError } as unknown);
	}

	it("sets loading and clears error on success", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockResolvedValue(undefined);

		const eff = leaveCommunity("c1", get);

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityError).toHaveBeenCalledWith(undefined);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ community_id: "c1" }),
		);
	});

	it("clears loading and sets error on failure", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockRejectedValue(new Error("boom"));

		const eff = leaveCommunity("c1", get);

		await expect(Effect.runPromise(eff)).rejects.toThrow("boom");

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith("boom");
	});
});
