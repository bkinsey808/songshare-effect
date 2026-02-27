import { Effect as EffectRuntime } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

type UseActiveEventSyncProps = {
	readonly eventSlug: string | undefined;
};

/**
 * Hook to manage the active event data: fetching by slug and subscribing to updates.
 */
export default function useActiveEventSync({ eventSlug }: UseActiveEventSyncProps): void {
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const subscribeToEvent = useAppStore((state) => state.subscribeToEvent);
	const currentEventId = useAppStore((state) => state.currentEvent?.event_id);

	// Fetch event data whenever the slug changes
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "") {
			return;
		}
		void EffectRuntime.runPromise(fetchEventBySlug(eventSlug));
	}, [eventSlug, fetchEventBySlug]);

	// Subscribe to realtime updates for the current event
	useEffect(() => {
		if (currentEventId === undefined) {
			return;
		}

		const unsubscribe = subscribeToEvent();
		return (): void => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [currentEventId, subscribeToEvent]);
}
