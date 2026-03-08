import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Get } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareUpdateStatusPath } from "@/shared/paths";

import type { ShareUpdateStatusRequest } from "../slice/share-types";
import type { ShareSlice } from "../slice/ShareSlice.type";
import updateShareStatusEffect from "./updateShareStatusEffect";

vi.mock("@/shared/fetch/postJsonWithResult");

describe("updateShareStatusEffect", () => {
	const FIRST_CALL = 1;
	const SECOND_CALL = 2;

	const shareId = "share-123";
	const request: ShareUpdateStatusRequest = {
		share_id: shareId,
		status: "accepted",
	};

	const setShareError = vi.fn();
	const setLoadingShareId = vi.fn();
	const updateShareStatusOptimistically = vi.fn();

	function makeGet(receivedShares: Record<string, { status: string }> = {}): Get<ShareSlice> {
		return () =>
			forceCast<ShareSlice>({
				updateShareStatusOptimistically,
				setShareError,
				setLoadingShareId,
				receivedShares,
			});
	}

	it("calls API, does optimistic update, and clears loading on success", async () => {
		vi.resetAllMocks();

		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockResolvedValue({ success: true });

		const get = makeGet({ [shareId]: { status: "pending" } });
		await Effect.runPromise(updateShareStatusEffect(request, get));

		expect(setLoadingShareId).toHaveBeenNthCalledWith(FIRST_CALL, shareId);
		expect(setShareError).toHaveBeenCalledWith(undefined);
		expect(updateShareStatusOptimistically).toHaveBeenCalledWith(shareId, "accepted");
		expect(mockPost).toHaveBeenCalledWith(apiShareUpdateStatusPath, request);
		expect(setLoadingShareId).toHaveBeenLastCalledWith(undefined);
	});

	it("uses pending as original status when share not in receivedShares", async () => {
		vi.resetAllMocks();

		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockResolvedValue({ success: true });

		const get = makeGet();
		await Effect.runPromise(updateShareStatusEffect(request, get));

		expect(updateShareStatusOptimistically).toHaveBeenCalledWith(shareId, "accepted");
		expect(mockPost).toHaveBeenCalledWith(apiShareUpdateStatusPath, request);
	});

	it("reverts optimistic update and sets error when API fails", async () => {
		vi.resetAllMocks();

		const errorMessage = "network fail";
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockRejectedValue(new Error(errorMessage));

		const get = makeGet({ [shareId]: { status: "pending" } });
		const eff = updateShareStatusEffect(request, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to update share status/);

		expect(updateShareStatusOptimistically).toHaveBeenNthCalledWith(
			FIRST_CALL,
			shareId,
			"accepted",
		);
		expect(updateShareStatusOptimistically).toHaveBeenNthCalledWith(
			SECOND_CALL,
			shareId,
			"pending",
		);
		expect(setShareError).toHaveBeenCalledWith(expect.stringMatching(new RegExp(errorMessage)));
		expect(setLoadingShareId).toHaveBeenLastCalledWith(undefined);
	});

	it("reverts to pending when share had no prior status and API fails", async () => {
		vi.resetAllMocks();

		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockRejectedValue(new Error("fail"));

		const get = makeGet();
		const eff = updateShareStatusEffect(request, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(/Failed to update share status/);

		expect(updateShareStatusOptimistically).toHaveBeenNthCalledWith(
			SECOND_CALL,
			shareId,
			"pending",
		);
	});

	it("handles reject status request", async () => {
		vi.resetAllMocks();

		const rejectRequest: ShareUpdateStatusRequest = {
			share_id: shareId,
			status: "rejected",
		};
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockResolvedValue({ success: true });

		const get = makeGet({ [shareId]: { status: "pending" } });
		await Effect.runPromise(updateShareStatusEffect(rejectRequest, get));

		expect(updateShareStatusOptimistically).toHaveBeenCalledWith(shareId, "rejected");
		expect(mockPost).toHaveBeenCalledWith(apiShareUpdateStatusPath, rejectRequest);
	});
});
