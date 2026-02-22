import { describe, expect, it, vi } from "vitest";

// mock extractErrorMessage helper so we can assert on its usage
import { mockExtractErrorMessage } from "@/react/lib/test-utils/mockExtractErrorMessage";

import type { ActionState } from "./ActionState.type";

import runAction from "./runAction";

// helper is invoked inside each test to avoid lint complaints about hooks

describe("runAction", () => {
	it("sets loading, calls action & refresh, and updates success for non-playback keys", async () => {
		mockExtractErrorMessage();
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "some-key",
			successMessage: "done",
			action: action as () => Promise<void>,
			setActionState: setActionState as (state: ActionState) => void,
			refreshFn: refreshFn as () => Promise<void>,
		});

		// first call should have loading state
		expect(setActionState).toHaveBeenCalledWith({
			loadingKey: "some-key",
			error: undefined,
			success: undefined,
		});

		// action and refresh must run
		expect(action).toHaveBeenCalledWith();
		expect(refreshFn).toHaveBeenCalledWith();

		// final state should clear loading and report success
		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: undefined,
			success: "done",
		});
	});

	it("does not touch state or refresh for playback actions", async () => {
		mockExtractErrorMessage();
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "playlist",
			successMessage: "ignored",
			action: action as () => Promise<void>,
			setActionState: setActionState as (state: ActionState) => void,
			refreshFn: refreshFn as () => Promise<void>,
		});

		expect(setActionState).not.toHaveBeenCalled();
		expect(refreshFn).not.toHaveBeenCalled();
		expect(action).toHaveBeenCalledWith();
	});

	it("propagates errors from action via extractErrorMessage", async () => {
		mockExtractErrorMessage();
		const action = vi.fn().mockRejectedValue(new Error("boom"));
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "x",
			successMessage: "irrelevant",
			action: action as () => Promise<void>,
			setActionState: setActionState as (state: ActionState) => void,
			refreshFn: refreshFn as () => Promise<void>,
		});

		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: "Error: boom-Action failed",
			success: undefined,
		});
	});

	it("treats refreshFn failures like action errors", async () => {
		mockExtractErrorMessage();
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockRejectedValue(new Error("nope"));
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "another",
			successMessage: "foo",
			action: action as () => Promise<void>,
			setActionState: setActionState as (state: ActionState) => void,
			refreshFn: refreshFn as () => Promise<void>,
		});

		// since refresh throws, final state should be error
		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: "Error: nope-Action failed",
			success: undefined,
		});
	});
});
