import { describe, expect, it, vi } from "vitest";

import runCommunityAction from "./runCommunityAction";

describe("runCommunityAction", () => {
	const FIRST_CALL_INDEX = 0;
	const SECOND_CALL_INDEX = 1;
	const FIRST_ARG_INDEX = 0;
	const LAST_INDEX_OFFSET = 1;
	const EXPECT_TWO_CALLS = 2;
	const EXPECT_ONE_CALL = 1;

	it("sets loading then error when action throws", async () => {
		const key = "delete-item";
		const action = vi.fn().mockRejectedValue(new Error("boom"));
		const setActionState = vi.fn();
		const refreshFn = vi.fn();

		await runCommunityAction({
			key,
			action,
			successMessage: "Success",
			setActionState,
			refreshFn,
		});

		expect(setActionState).toHaveBeenCalledTimes(EXPECT_TWO_CALLS);
		expect(setActionState.mock.calls[FIRST_CALL_INDEX]?.[FIRST_ARG_INDEX]).toStrictEqual({
			loadingKey: key,
			error: undefined,
			errorKey: undefined,
			success: undefined,
			successKey: undefined,
		});

		expect(setActionState.mock.calls[SECOND_CALL_INDEX]?.[FIRST_ARG_INDEX]).toStrictEqual({
			loadingKey: undefined,
			error: "boom",
			errorKey: key,
			success: undefined,
			successKey: undefined,
		});

		expect(refreshFn).not.toHaveBeenCalled();
	});

	it("calls refreshFn on success and sets success state", async () => {
		const key = "invite";
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn();

		await runCommunityAction({
			key,
			action,
			successMessage: "Invited",
			setActionState,
			refreshFn,
		});

		expect(action).toHaveBeenCalledTimes(EXPECT_ONE_CALL);
		expect(refreshFn).toHaveBeenCalledTimes(EXPECT_ONE_CALL);

		const lastIdx = setActionState.mock.calls.length - LAST_INDEX_OFFSET;
		expect(setActionState.mock.calls[lastIdx]?.[FIRST_ARG_INDEX]).toStrictEqual({
			loadingKey: undefined,
			error: undefined,
			errorKey: undefined,
			success: "Invited",
			successKey: key,
		});
	});

	it("swallows refresh errors and still sets success", async () => {
		const key = "update";
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockRejectedValue(new Error("refresh fail"));
		const setActionState = vi.fn();

		await runCommunityAction({
			key,
			action,
			successMessage: "Updated",
			setActionState,
			refreshFn,
		});

		expect(refreshFn).toHaveBeenCalledTimes(EXPECT_ONE_CALL);
		const lastIdx = setActionState.mock.calls.length - LAST_INDEX_OFFSET;
		expect(setActionState.mock.calls[lastIdx]?.[FIRST_ARG_INDEX]).toStrictEqual({
			loadingKey: undefined,
			error: undefined,
			errorKey: undefined,
			success: "Updated",
			successKey: key,
		});
	});
});
