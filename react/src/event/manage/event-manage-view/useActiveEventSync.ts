import { Effect as EffectRuntime } from "effect";
import { useEffect } from "react";

import useAppStore from "@/react/app-store/useAppStore";

type UseActiveEventSyncProps = {
	readonly eventSlug: string | undefined;
};

/**
 * Hook to manage the active event data: fetching by slug and subscribing to updates.
 *
 * @param eventSlug - slug of the event to load and subscribe to
 * @returns void
 */
export default function useActiveEventSync({ eventSlug }: UseActiveEventSyncProps): void {
	const fetchEventBySlug = useAppStore((state) => state.fetchEventBySlug);
	const subscribeToEvent = useAppStore((state) => state.subscribeToEvent);
	const currentEventId = useAppStore((state) => state.currentEvent?.event_id);
	// Re-fetch when user authenticates so private events load with the correct token.
	const currentUserId = useAppStore((state) => state.userSessionData?.user.user_id);

	// Fetch event data whenever the slug or authenticated user changes
	useEffect(() => {
		if (eventSlug === undefined || eventSlug === "") {
			// oxlint-disable-next-line no-empty-function -- no fetch when undefined; return fn for React 19 HMR
			return;
		}
		void EffectRuntime.runPromise(fetchEventBySlug(eventSlug));
		// oxlint-disable-next-line no-empty-function -- no cleanup for fetch; return fn for React 19 HMR
		return;
	}, [eventSlug, fetchEventBySlug, currentUserId]);

	// Subscribe to realtime updates for the current event
	useEffect(() => {
		if (currentEventId === undefined) {
			// oxlint-disable-next-line no-empty-function -- no subscription when undefined; return fn for React 19 HMR
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
