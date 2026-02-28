import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import getJson from "@/shared/fetch/getJson";

import type { CommunitySlice } from "../slice/CommunitySlice.type";

import fetchCommunityLibrary from "./fetchCommunityLibrary";

vi.mock("@/shared/fetch/getJson");

describe("fetchCommunityLibrary", () => {
	const FIRST_CALL = 1;

	it("fetches communities and updates slice on success", async () => {
		const mockCommunities = [
			{
				community_id: "c1",
				owner_id: "o1",
				name: "C",
				slug: "c",
				description: "d",
				is_public: true,
				public_notes: undefined,
				created_at: "2020-01-01",
				updated_at: "2020-01-01",
			},
		];

		vi.mocked(getJson).mockResolvedValueOnce(mockCommunities);

		const setCommunities = vi.fn();
		const setCommunityLoading = vi.fn();
		const setCommunityError = vi.fn();

		function get(): CommunitySlice {
			return forceCast({ setCommunities, setCommunityLoading, setCommunityError });
		}

		const result = await Effect.runPromise(fetchCommunityLibrary(get));

		expect(result).toStrictEqual(mockCommunities);
		expect(setCommunities).toHaveBeenCalledWith(mockCommunities);
		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityLoading).toHaveBeenCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith(undefined);
	});

	it("sets error state when getJson throws", async () => {
		vi.mocked(getJson).mockRejectedValueOnce(new Error("boom"));

		const setCommunities = vi.fn();
		const setCommunityLoading = vi.fn();
		const setCommunityError = vi.fn();

		function get(): CommunitySlice {
			return forceCast({ setCommunities, setCommunityLoading, setCommunityError });
		}

		await expect(Effect.runPromise(fetchCommunityLibrary(get))).rejects.toThrow("boom");

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
	});
});
