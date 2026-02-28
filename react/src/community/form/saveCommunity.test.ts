import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiCommunitySavePath } from "@/shared/paths";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import saveCommunity from "./saveCommunity";

vi.mock("@/shared/fetch/postJsonWithResult");

describe("saveCommunity", () => {
	const FIRST_CALL = 1;

	const setCommunitySaving = vi.fn();
	const setCommunityError = vi.fn();

	function get(): CommunitySlice {
		return forceCast({ setCommunitySaving, setCommunityError } as unknown);
	}

	const request = { name: "Test", slug: "test" };
	const savedEntry = { id: "c1", name: "Test", created_at: "now" } as unknown;

	it("sets saving and clears error on success", async () => {
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockResolvedValue(savedEntry);

		const eff = saveCommunity(request, get);

		const res = await Effect.runPromise(eff);
		expect(res).toBe(savedEntry);

		expect(setCommunitySaving).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityError).toHaveBeenCalledWith(undefined);
		expect(setCommunitySaving).toHaveBeenLastCalledWith(false);
		expect(mockPost).toHaveBeenCalledWith(apiCommunitySavePath, request);
	});

	it("clears saving and sets error on failure", async () => {
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockRejectedValue(new Error("boom"));

		const eff = saveCommunity(request, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow("boom");

		expect(setCommunitySaving).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunitySaving).toHaveBeenLastCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith("boom");
	});
});
