import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import postJson from "@/shared/fetch/postJson";
import { apiCommunityUserJoinPath } from "@/shared/paths";

import makeInvitationSlice from "../slice/makeInvitationSlice.test-util";
import acceptCommunityInvitation from "./acceptCommunityInvitation";

vi.mock("@/shared/fetch/postJson");

describe("acceptCommunityInvitation", () => {
	it("calls join API and optimistically updates slice", async () => {
		const mockedPost = vi.mocked(postJson);
		mockedPost.mockResolvedValueOnce(undefined);

		const setPendingCommunityInvitations = vi.fn();
		const setInvitationError = vi.fn();

		const communityId = "c1";
		const invitation = {
			community_id: communityId,
			community_name: "C1",
			community_slug: "c1-slug",
		};

		const slice = makeInvitationSlice({
			pendingCommunityInvitations: [invitation],
			setPendingCommunityInvitations,
			setInvitationError,
		});

		await Effect.runPromise(acceptCommunityInvitation(communityId, () => slice));

		expect(mockedPost).toHaveBeenCalledWith(apiCommunityUserJoinPath, {
			community_id: communityId,
		});

		expect(setPendingCommunityInvitations).toHaveBeenCalledWith([
			{ ...invitation, accepted: true },
		]);
		expect(setInvitationError).toHaveBeenCalledWith(undefined);
	});

	it("sets error message on failure", async () => {
		const mockedPost = vi.mocked(postJson);
		mockedPost.mockRejectedValueOnce(new Error("boom"));

		const setInvitationError = vi.fn();

		const slice = makeInvitationSlice({
			setInvitationError,
		});

		const effect = acceptCommunityInvitation("c1", () => slice);
		await expect(Effect.runPromise(effect)).rejects.toThrow("boom");

		expect(setInvitationError).toHaveBeenCalledWith("boom");
	});
});
