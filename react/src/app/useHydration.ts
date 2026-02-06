import { awaitAppStoreHydration } from "@/react/app-store/hydration";
import useAppStoreHydrated from "@/react/app-store/useAppStoreHydrated";

/**
 * Hook to access app-level hydration state and utilities.
 *
 * The persisted app store rehydrates asynchronously from localStorage via Zustand's
 * persist middleware. Components that depend on app store state should use this hook
 * to know when rehydration is complete, allowing them to render consistently and
 * avoid hydration mismatches, race conditions, and premature redirects.
 *
 * @returns Object containing:
 *   - `isHydrated`: boolean indicating whether the store has finished rehydrating.
 *   - `awaitHydration`: async function to wait until hydration completes.
 *     Safe to call anywhere (component body, effects, event handlers, etc).
 *
 * @example
 * // Conditional render until hydration completes
 * const { isHydrated } = useHydration();
 * if (!isHydrated) return <div />;
 *
 * @example
 * // Await hydration in an effect
 * const { awaitHydration } = useHydration();
 * useEffect(() => {
 *   (async () => {
 *     await awaitHydration();
 *     // safe to use store state here
 *   })();
 * }, [awaitHydration]);
 */
export default function useHydration(): {
	isHydrated: boolean;
	awaitHydration: typeof awaitAppStoreHydration;
} {
	const { isHydrated } = useAppStoreHydrated();

	return {
		isHydrated,
		/** @todo - awaitHydration is not yet used in the app, but is provided for future needs */
		awaitHydration: awaitAppStoreHydration,
	};
}
