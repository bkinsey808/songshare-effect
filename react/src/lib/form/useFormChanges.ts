import { useEffect, useRef, useState } from "react";

import defaultCompare from "./defaultCompare";

/**
 * Options for tracking form changes
 */
type UseFormChangesOptions<State> = {
	/**
	 * Current form state to track
	 */
	readonly currentState: State;
	/**
	 * Optional custom comparison function. If not provided, uses deep equality.
	 * Return true if states are different (has changes).
	 */
	readonly compare?: (current: State, initial: State) => boolean;
	/**
	 * Whether to track changes. If false, hasUnsavedChanges will always return false.
	 * Useful for disabling tracking during loading or when form is not ready.
	 */
	readonly enabled?: boolean;
};

type UseFormChangesReturn<State> = {
	/**
	 * Whether the form has unsaved changes compared to the initial state
	 */
	readonly hasUnsavedChanges: () => boolean;
	/**
	 * Set the initial state (snapshot of current state as the baseline)
	 */
	readonly setInitialState: (state: State) => void;
	/**
	 * Clear the initial state (useful when resetting or starting fresh)
	 */
	readonly clearInitialState: () => void;
	/**
	 * Reset the initial state to the current state
	 */
	readonly resetInitialState: () => void;
	/**
	 * Get the current initial state snapshot
	 */
	readonly getInitialState: () => State | undefined;
};

/**
 * Hook for tracking unsaved changes in forms.
 *
 * Tracks the current state of a form and compares it to an initial snapshot
 * to determine if there are unsaved changes.
 *
 * @param currentState - The current form state to compare against baseline
 * @param compare - Optional custom comparison function
 * @param enabled - Optional flag to enable or disable change tracking
 * @returns An object with helpers for tracking form changes
 * @example
 * ```tsx
 * const { hasUnsavedChanges, setInitialState } = useFormChanges({
 *   currentState: { name: formName, email: formEmail },
 *   enabled: !isLoading,
 * });
 *
 * // When form is loaded/ready, set initial state
 * useEffect(() => {
 *   if (formData) {
 *     setInitialState({ name: formData.name, email: formData.email });
 *   }
 * }, [formData]);
 * ```
 */
export default function useFormChanges<State>({
	currentState,
	compare = defaultCompare,
	enabled = true,
}: UseFormChangesOptions<State>): UseFormChangesReturn<State> {
	const [initialState, setInitialStateState] = useState<State | undefined>(undefined);
	const initialStateRef = useRef<State | undefined>(undefined);

	// Keep ref in sync with state
	useEffect(() => {
		initialStateRef.current = initialState;
	}, [initialState]);

	/**
	 * Set the baseline initial state used for change detection.
	 *
	 * @param state - Baseline state snapshot
	 * @returns void
	 */
	function setInitialState(state: State): void {
		setInitialStateState(state);
		initialStateRef.current = state;
	}

	/**
	 * Clear the baseline initial state so change detection is disabled until set again.
	 *
	 * @returns void
	 */
	function clearInitialState(): void {
		setInitialStateState(undefined);
		initialStateRef.current = undefined;
	}

	/**
	 * Reset the baseline initial state to the current state value.
	 *
	 * @returns void
	 */
	function resetInitialState(): void {
		setInitialState(currentState);
	}

	/**
	 * Get the current baseline initial state snapshot.
	 *
	 * @returns The baseline state or `undefined` if not set
	 */
	function getInitialState(): State | undefined {
		return initialStateRef.current;
	}

	/**
	 * Determine whether the current state differs from the baseline snapshot.
	 *
	 * @returns `true` when there are unsaved changes, otherwise `false`
	 */
	function hasUnsavedChanges(): boolean {
		if (!enabled) {
			return false;
		}

		const initial = initialStateRef.current;
		if (initial === undefined) {
			// No initial state set yet - can't determine if there are changes without a baseline
			// Return false to avoid false positives when form is being populated/initialized
			return false;
		}

		return compare(currentState, initial);
	}

	return {
		hasUnsavedChanges,
		setInitialState,
		clearInitialState,
		resetInitialState,
		getInitialState,
	};
}
