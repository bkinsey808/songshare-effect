// Shared hydration utilities used by the app store and hydration hooks.

/**
 * Global hydration state for the app store.
 *
 * - `isHydrated` indicates whether the store has finished hydrating from any
 *   persisted source.
 * - `listeners` holds callbacks to notify when hydration completes.
 * - `promise` and `resolvePromise` provide a promise-based subscription
 *   mechanism for callers that prefer awaiting hydration.
 */
const hydrationState = {
	isHydrated: false,
	listeners: new Set<() => void>(),
	promise: undefined as Promise<void> | undefined,
	resolvePromise: undefined as (() => void) | undefined,
};

// Initialize the hydration promise safely. This mirrors the previous
// initialization in `useAppStore.ts` but keeps the hydration state decoupled
// so hooks can live in their own modules without circular imports.
if (typeof Promise !== "undefined") {
	// oxlint-disable-next-line promise/avoid-new
	hydrationState.promise = new Promise<void>((resolve) => {
		hydrationState.resolvePromise = resolve;
	});
}

/**
 * Await the app store hydration completion.
 *
 * This will immediately return when hydration has already completed. When
 * hydration is pending it waits on an internal promise which is resolved by
 * the store once hydration finishes. Consumers may call this from async
 * effects or during test setup to ensure the store is ready.
 *
 * @returns Promise<void> that resolves when the store is hydrated
 */
export async function awaitAppStoreHydration(): Promise<void> {
	if (hydrationState.isHydrated) {
		return;
	}
	await (hydrationState.promise ?? Promise.resolve());
}

/**
 * Export the shared hydration state so callers can read flags or register
 * listeners. Prefer `awaitAppStoreHydration()` for awaiting hydration when
 * possible rather than accessing the promise directly.
 */
export { hydrationState };
