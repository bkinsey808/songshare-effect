import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";
import postJson from "@/shared/fetch/postJson";

import type { CommunitySlice } from "../slice/CommunitySlice.type";
import addMember from "./addMember";

vi.mock("@/shared/fetch/postJson");

describe("addMember", () => {
	const FIRST_CALL = 1;

	const setCommunityLoading = vi.fn();
	const setCommunityError = vi.fn();
	/**
	 * Test getter providing the minimal `CommunitySlice` used by addMember.
	 *
	 * @returns CommunitySlice for the test
	 */
	function get(): CommunitySlice {
		return forceCast({ setCommunityLoading, setCommunityError } as unknown);
	}

	it("sets loading and clears error on success", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockReturnValue(Effect.succeed(undefined));

		const eff = addMember({ communityId: "c1", userId: "u1", role: "member", get });

		await expect(Effect.runPromise(eff)).resolves.toBeUndefined();

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityError).toHaveBeenCalledWith(undefined);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(mockPost).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ community_id: "c1", user_id: "u1", role: "member" }),
		);
	});

	it("clears loading and sets error on failure", async () => {
		const mockPost = vi.mocked(postJson);
		mockPost.mockReturnValue(Effect.fail(new Error("boom")));

		const eff = addMember({ communityId: "c1", userId: "u1", role: "member", get });

		await expect(Effect.runPromise(eff)).rejects.toThrow("boom");

		expect(setCommunityLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setCommunityLoading).toHaveBeenLastCalledWith(false);
		expect(setCommunityError).toHaveBeenCalledWith("boom");
	});
});
