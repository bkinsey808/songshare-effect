import { describe, expect, it, vi } from "vitest";

import forceCast from "@/react/lib/test-utils/forceCast";

import type { CommunityActionState } from "../CommunityActionState.type";

import runCommunityAction from "./runCommunityAction";

const ACTION_KEY = "test-action";
const SUCCESS_MSG = "Done!";
const LOADING_CALL_INDEX = 0;
const SUCCESS_OR_ERROR_CALL_INDEX = 1;
const FIRST_CALL_ARG_INDEX = 0;
const EXPECTED_SUCCESS_PATH_CALL_COUNT = 2;

describe("runCommunityAction", () => {
	it("sets loading state, runs action, refreshes, then sets success on success", async () => {
		const setActionState = vi.fn();
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);

		await runCommunityAction({
			key: ACTION_KEY,
			action,
			successMessage: SUCCESS_MSG,
			setActionState,
			refreshFn,
		});

		expect(setActionState).toHaveBeenCalledTimes(EXPECTED_SUCCESS_PATH_CALL_COUNT);

		const loadingCall = forceCast<CommunityActionState>(
			setActionState.mock.calls[LOADING_CALL_INDEX]?.[FIRST_CALL_ARG_INDEX],
		);
		expect(loadingCall).toMatchObject({ loadingKey: ACTION_KEY, error: undefined });

		expect(action).toHaveBeenCalledOnce();
		expect(refreshFn).toHaveBeenCalledOnce();

		const successCall = forceCast<CommunityActionState>(
			setActionState.mock.calls[SUCCESS_OR_ERROR_CALL_INDEX]?.[FIRST_CALL_ARG_INDEX],
		);
		expect(successCall).toMatchObject({
			success: SUCCESS_MSG,
			successKey: ACTION_KEY,
			loadingKey: undefined,
		});
	});

	it("sets error state when action throws", async () => {
		const setActionState = vi.fn();
		const errorMsg = "Action failed";
		const action = vi.fn().mockRejectedValue(new Error(errorMsg));
		const refreshFn = vi.fn();

		await runCommunityAction({
			key: ACTION_KEY,
			action,
			successMessage: SUCCESS_MSG,
			setActionState,
			refreshFn,
		});

		expect(setActionState).toHaveBeenCalledTimes(EXPECTED_SUCCESS_PATH_CALL_COUNT);
		expect(refreshFn).not.toHaveBeenCalled();

		const errorCall = forceCast<CommunityActionState>(
			setActionState.mock.calls[SUCCESS_OR_ERROR_CALL_INDEX]?.[FIRST_CALL_ARG_INDEX],
		);
		expect(errorCall.error).toBe(errorMsg);
		expect(errorCall.errorKey).toBe(ACTION_KEY);
		expect(errorCall.loadingKey).toBeUndefined();
	});

	it("converts non-Error throw to string in error state", async () => {
		const setActionState = vi.fn();
		const action = vi.fn().mockRejectedValue("string error");

		await runCommunityAction({
			key: ACTION_KEY,
			action,
			successMessage: SUCCESS_MSG,
			setActionState,
			refreshFn: vi.fn(),
		});

		const errorCall = forceCast<CommunityActionState>(
			setActionState.mock.calls[SUCCESS_OR_ERROR_CALL_INDEX]?.[FIRST_CALL_ARG_INDEX],
		);
		expect(errorCall.error).toBe("string error");
	});

	it("sets success state even when refresh fails after successful action", async () => {
		const setActionState = vi.fn();
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockRejectedValue(new Error("Refresh failed"));

		await runCommunityAction({
			key: ACTION_KEY,
			action,
			successMessage: SUCCESS_MSG,
			setActionState,
			refreshFn,
		});

		expect(setActionState).toHaveBeenCalledTimes(EXPECTED_SUCCESS_PATH_CALL_COUNT);
		const successCall = forceCast<CommunityActionState>(
			setActionState.mock.calls[SUCCESS_OR_ERROR_CALL_INDEX]?.[FIRST_CALL_ARG_INDEX],
		);
		expect(successCall.success).toBe(SUCCESS_MSG);
	});
});
