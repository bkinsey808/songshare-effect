import { describe, expect, it, vi } from "vitest";

import type { ActionState } from "./ActionState.type";

import runAction from "./runAction";

// mock extractErrorMessage helper so we can assert on its usage
// oxlint-disable-next-line jest/no-untyped-mock-factory
vi.mock("@/shared/error-message/extractErrorMessage", () => ({
	__esModule: true,
	default: vi.fn((err: unknown, def: string) => `${String(err)}-${def}`),
}));

describe("runAction", () => {
	it("sets loading, calls action & refresh, and updates success for non-playback keys", async () => {
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "some-key",
			successMessage: "done",
			action,
			setActionState,
			refreshFn,
		});

		// first call should have loading state
		expect(setActionState).toHaveBeenCalledWith({
			loadingKey: "some-key",
			error: undefined,
			success: undefined,
		});

		// action and refresh must run
		// oxlint-disable-next-line jest/prefer-called-with
		expect(action).toHaveBeenCalled();
		// oxlint-disable-next-line jest/prefer-called-with
		expect(refreshFn).toHaveBeenCalled();

		// final state should clear loading and report success
		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: undefined,
			success: "done",
		});
	});

	it("does not touch state or refresh for playback actions", async () => {
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "playlist",
			successMessage: "ignored",
			action,
			setActionState,
			refreshFn,
		});

		expect(setActionState).not.toHaveBeenCalled();
		expect(refreshFn).not.toHaveBeenCalled();
		// oxlint-disable-next-line jest/prefer-called-with
		expect(action).toHaveBeenCalled();
	});

	it("propagates errors from action via extractErrorMessage", async () => {
		const action = vi.fn().mockRejectedValue(new Error("boom"));
		const refreshFn = vi.fn().mockResolvedValue(undefined);
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "x",
			successMessage: "irrelevant",
			action,
			setActionState,
			refreshFn,
		});

		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: "Error: boom-Action failed",
			success: undefined,
		});
	});

	it("treats refreshFn failures like action errors", async () => {
		const action = vi.fn().mockResolvedValue(undefined);
		const refreshFn = vi.fn().mockRejectedValue(new Error("nope"));
		const setActionState = vi.fn<(state: ActionState) => void>();

		await runAction({
			actionKey: "another",
			successMessage: "foo",
			action,
			setActionState,
			refreshFn,
		});

		// since refresh throws, final state should be error
		expect(setActionState).toHaveBeenLastCalledWith({
			loadingKey: undefined,
			error: "Error: nope-Action failed",
			success: undefined,
		});
	});
});
