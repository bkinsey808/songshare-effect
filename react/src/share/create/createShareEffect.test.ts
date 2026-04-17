import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";

import type { Get } from "@/react/app-store/app-store-types";
import forceCast from "@/react/lib/test-utils/forceCast";
import postJsonWithResult from "@/shared/fetch/postJsonWithResult";
import { apiShareCreatePath } from "@/shared/paths";

import type { ShareCreateRequest } from "../slice/share-types";
import type { ShareSlice } from "../slice/ShareSlice.type";
import createShareEffect from "./createShareEffect";

vi.mock("@/shared/fetch/postJsonWithResult");

describe("createShareEffect", () => {
	const FIRST_CALL = 1;

	const emptySenderUserId = "";

	const setSharesLoading = vi.fn();
	const setShareError = vi.fn();
	const setLoadingShareId = vi.fn();
	const addSentShare = vi.fn();

	/**
	 * Build a `get` function returning a minimal ShareSlice for tests.
	 *
	 * @returns A `Get<ShareSlice>` mock that provides the slice methods used in tests
	 */
	function makeGet(): Get<ShareSlice> {
		return () =>
			forceCast<ShareSlice>({
				setSharesLoading,
				setShareError,
				setLoadingShareId,
				addSentShare,
			});
	}

	const shareId = "share-123";
	const request: ShareCreateRequest = {
		recipient_user_id: "user-456",
		shared_item_type: "song",
		shared_item_id: "song-789",
		shared_item_name: "My Song",
	};

	it("returns shareId, calls API, and adds optimistic share on success", async () => {
		vi.resetAllMocks();

		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockReturnValue(Effect.succeed({ shareId }));

		const get = makeGet();
		const eff = createShareEffect(request, get);

		const result = await Effect.runPromise(eff);

		expect(result).toStrictEqual({ shareId });
		expect(mockPost).toHaveBeenCalledWith(apiShareCreatePath, request);
		expect(setShareError).toHaveBeenCalledWith(undefined);
		expect(addSentShare).toHaveBeenCalledWith(
			expect.objectContaining({
				share_id: shareId,
				sender_user_id: emptySenderUserId,
				recipient_user_id: request.recipient_user_id,
				shared_item_type: request.shared_item_type,
				shared_item_id: request.shared_item_id,
				shared_item_name: request.shared_item_name,
				status: "pending",
				message: undefined,
			}),
		);
	});

	it("sets and clears loading state on success", async () => {
		vi.resetAllMocks();

		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockReturnValue(Effect.succeed({ shareId }));

		const get = makeGet();
		await Effect.runPromise(createShareEffect(request, get));

		expect(setSharesLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setSharesLoading).toHaveBeenLastCalledWith(false);
		expect(setLoadingShareId).toHaveBeenCalledWith(undefined);
	});

	it("includes message in optimistic share when request has message", async () => {
		vi.resetAllMocks();

		const requestWithMessage = { ...request, message: "Check this out!" };
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockReturnValue(Effect.succeed({ shareId }));

		const get = makeGet();
		const eff = createShareEffect(requestWithMessage, get);

		await Effect.runPromise(eff);

		expect(addSentShare).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Check this out!",
			}),
		);
	});

	it("sets error and clears loading when API fails", async () => {
		vi.resetAllMocks();

		const errorMessage = "network fail";
		const mockPost = vi.mocked(postJsonWithResult);
		mockPost.mockReturnValue(Effect.fail(new Error(errorMessage)));

		const get = makeGet();
		const eff = createShareEffect(request, get);

		await expect(Effect.runPromise(eff)).rejects.toThrow(errorMessage);

		expect(setSharesLoading).toHaveBeenNthCalledWith(FIRST_CALL, true);
		expect(setShareError).toHaveBeenCalledWith(expect.stringMatching(new RegExp(errorMessage)));
		expect(addSentShare).not.toHaveBeenCalled();
		expect(setSharesLoading).toHaveBeenLastCalledWith(false);
		expect(setLoadingShareId).toHaveBeenCalledWith(undefined);
	});
});
