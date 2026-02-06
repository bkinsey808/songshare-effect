// Shared hydration utilities used by the app store and hydration hooks.

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

export async function awaitAppStoreHydration(): Promise<void> {
	if (hydrationState.isHydrated) {
		return;
	}
	await (hydrationState.promise ?? Promise.resolve());
}

export { hydrationState };
