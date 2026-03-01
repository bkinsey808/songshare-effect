import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import useFormChanges from "./useFormChanges";

type DummyState = { count: number; text: string };

// aliases used for renderHook generics to avoid unsafe-any complaints
// (the hook returns a complex object; we only care that `result.current` is
// typed properly so the linter stops complaining about `any`.)

type HookReturn = ReturnType<typeof useFormChanges<DummyState>>;
type HookProps = {
	currentState: DummyState;
	enabled?: boolean;
	compare?: (current: DummyState, initial: DummyState) => boolean;
};

// constant used in a couple of assertions to avoid the magic-number rule
const NO_CHANGES = false;

// helpers ------------------------------------------------------------------

/**
 * Construct options object for `useFormChanges` without accidentally passing
 * `undefined` values.  This keeps us from running afoul of
 * `exactOptionalPropertyTypes` when we later call the hook.
 */
function makeOpts(
	currentState: DummyState,
	enabled?: boolean,
	compare?: (current: DummyState, initial: DummyState) => boolean,
): HookProps {
	const opts: HookProps = { currentState };
	if (enabled !== undefined) {
		opts.enabled = enabled;
	}
	if (compare !== undefined) {
		opts.compare = compare;
	}
	return opts;
}

describe("useFormChanges", () => {
	const initial: DummyState = { count: 0, text: "" };
	const changed: DummyState = { count: 1, text: "hello" };

	it("returns false when tracking is disabled", () => {
		const { result, rerender } = renderHook<HookReturn, HookProps>(
			({ currentState, enabled }) => useFormChanges(makeOpts(currentState, enabled)),
			{
				initialProps: { currentState: initial, enabled: false },
			},
		);

		expect(result.current.hasUnsavedChanges()).toBe(false);

		// even if we provide an initial state and subsequently change the state
		result.current.setInitialState(initial);
		rerender({ currentState: changed, enabled: false });
		expect(result.current.hasUnsavedChanges()).toBe(false);
	});

	it("does not consider changes before an initial state is set", () => {
		const { result, rerender } = renderHook<HookReturn, HookProps>(
			({ currentState }) => useFormChanges(makeOpts(currentState)),
			{ initialProps: { currentState: initial } },
		);

		// no baseline yet
		expect(result.current.getInitialState()).toBeUndefined();

		// even after changing current state, still false
		rerender({ currentState: changed });
		expect(result.current.hasUnsavedChanges()).toBe(false);
	});

	it("tracks unsaved changes with default deep compare", () => {
		const { result, rerender } = renderHook<HookReturn, HookProps>(
			({ currentState }) => useFormChanges(makeOpts(currentState)),
			{ initialProps: { currentState: initial } },
		);

		// set baseline
		result.current.setInitialState(initial);
		expect(result.current.getInitialState()).toStrictEqual(initial);
		expect(result.current.hasUnsavedChanges()).toBe(false);

		// change the current state and verify detection
		rerender({ currentState: changed });
		expect(result.current.hasUnsavedChanges()).toBe(true);

		// reset baseline using resetInitialState
		result.current.resetInitialState();
		expect(result.current.getInitialState()).toStrictEqual(changed);
		expect(result.current.hasUnsavedChanges()).toBe(false);
	});

	it("clearInitialState clears the baseline and prevents change detection", () => {
		const { result, rerender } = renderHook<HookReturn, HookProps>(
			({ currentState }) => useFormChanges(makeOpts(currentState)),
			{ initialProps: { currentState: initial } },
		);

		result.current.setInitialState(initial);
		expect(result.current.hasUnsavedChanges()).toBe(false);
		result.current.clearInitialState();

		// after clearing, getInitialState yields undefined and no change will be reported
		expect(result.current.getInitialState()).toBeUndefined();
		rerender({ currentState: changed });
		expect(result.current.hasUnsavedChanges()).toBe(false);
	});

	it("honors a custom compare function", () => {
		// comparer returns true on first invocation, then false thereafter
		const comparer = vi.fn().mockReturnValueOnce(true).mockReturnValue(false);

		const { result } = renderHook<HookReturn, HookProps>(
			({ currentState, compare }) => useFormChanges(makeOpts(currentState, undefined, compare)),
			{
				initialProps: { currentState: initial, compare: comparer },
			},
		);

		// baseline not set yet
		expect(result.current.hasUnsavedChanges()).toBe(NO_CHANGES);

		result.current.setInitialState(initial);
		expect(comparer).not.toHaveBeenCalled();

		// first call triggers the mocked true value
		expect(result.current.hasUnsavedChanges()).toBe(true);
		expect(comparer).toHaveBeenCalledWith(initial, initial);
	});

	it("honors custom compare on rerenders", () => {
		const comparer = vi.fn().mockReturnValue(false);

		const { result, rerender } = renderHook<HookReturn, HookProps>(
			({ currentState, compare }) => useFormChanges(makeOpts(currentState, undefined, compare)),
			{
				initialProps: { currentState: initial, compare: comparer },
			},
		);

		result.current.setInitialState(initial);

		rerender({ currentState: initial, compare: comparer });
		expect(result.current.hasUnsavedChanges()).toBe(NO_CHANGES);

		rerender({ currentState: changed, compare: comparer });
		// comparer always returns false so even a real change shouldn't be flagged
		expect(result.current.hasUnsavedChanges()).toBe(NO_CHANGES);
	});
});
