// Small module to hold reset functions for Zustand slices.
// This avoids a circular dependency between slice creators and the
// top-level store when both modules import each other.
export const sliceResetFns: Set<() => void> = new Set<() => void>();

/**
 * Invoke all registered slice reset functions to reset application state.
 *
 * @returns void
 */
export function resetAllSlices(): void {
	for (const resetFn of sliceResetFns) {
		resetFn();
	}
}
