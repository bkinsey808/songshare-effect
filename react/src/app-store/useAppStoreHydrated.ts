import { useEffect, useState } from "react";

import useSchedule from "@/react/lib/hooks/useSchedule";

import { hydrationState } from "./hydration";

/**
 * Hook that reports when the application store has finished hydrating.
 *
 * The hook reads from the central `hydrationState` and subscribes a listener
 * that defers state updates via the `schedule` hook so consumers receive the
 * update outside of a render pass.
 *
 * @returns isHydrated - true when the app store has been hydrated
 */
export default function useAppStoreHydrated(): { isHydrated: boolean } {
	const schedule = useSchedule();
	const [isHydrated, setIsHydrated] = useState(hydrationState.isHydrated);

	// Subscribe to hydration state changes and update local isHydrated state
	useEffect(() => {
		if (hydrationState.isHydrated) {
			schedule(() => {
				setIsHydrated(true);
			});
			return;
		}

		function listener(): void {
			schedule(() => {
				setIsHydrated(true);
			});
		}

		hydrationState.listeners.add(listener);
		return (): void => {
			hydrationState.listeners.delete(listener);
		};
	}, [schedule]);

	return { isHydrated };
}
